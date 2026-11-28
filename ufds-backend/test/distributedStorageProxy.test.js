import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Readable, Writable } from "node:stream";
import { after, before, test } from "node:test";

let upstream;
let upstreamUrl;
let proxy;
let proxyRequest;
let sendResponse;
let receivedRequest;

class MockResponse extends Writable {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = new Map();
    this.chunks = [];
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  setHeader(name, value) {
    this.headers.set(name.toLowerCase(), value);
  }

  _write(chunk, encoding, callback) {
    this.chunks.push(Buffer.from(chunk));
    callback();
  }
}

before(async () => {
  upstream = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    receivedRequest = {
      method: req.method,
      url: req.url,
      authorization: req.headers.authorization,
      internalServiceToken: req.headers["x-internal-service-token"],
      contentType: req.headers["content-type"],
      body: Buffer.concat(chunks),
    };
    res.writeHead(201, { "content-type": "application/json" });
    res.end(JSON.stringify({ success: true, file: { id: "test-file" } }));
  });
  await new Promise((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  upstreamUrl = `http://127.0.0.1:${upstream.address().port}`;
  process.env.NODE_ENV = "test";
  process.env.DISTRIBUTED_STORAGE_URL = upstreamUrl;
  process.env.JWT_ACCESS_SECRET ||= "proxy-test-secret";
  process.env.INTERNAL_SERVICE_TOKEN = "proxy-test-service-token-at-least-32-bytes";
  process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/proxy-test";
  ({ requestDistributedStorage: proxyRequest, sendDistributedStorageResponse: sendResponse } =
    await import("../services/distributedStorageProxy.service.js"));
  proxy = { proxyRequest, sendResponse };
});

after(async () => {
  if (upstream) await new Promise((resolve) => upstream.close(resolve));
});

test("forwards the authenticated multipart upload stream and relays the response", async () => {
  const payload = Buffer.from("multipart-file-bytes");
  const boundary = "proxy-test-boundary";
  const request = Readable.from([payload]);
  request.method = "POST";
  request.get = (name) => ({
    authorization: "Bearer proxy-test-token",
    "x-internal-service-token": "ignored-incoming-value",
    "content-type": `multipart/form-data; boundary=${boundary}`,
    "content-length": String(payload.length),
    "idempotency-key": "proxy-idempotency-key",
  })[name.toLowerCase()];

  const upstreamResponse = await proxy.proxyRequest(request, "/upload", {
    method: "POST",
    streamBody: true,
  });
  const response = new MockResponse();
  await proxy.sendResponse(upstreamResponse, response);

  assert.equal(receivedRequest.method, "POST");
  assert.equal(receivedRequest.url, "/api/files/upload");
  assert.equal(receivedRequest.authorization, "Bearer proxy-test-token");
  assert.equal(receivedRequest.internalServiceToken, "proxy-test-service-token-at-least-32-bytes");
  assert.equal(receivedRequest.contentType, `multipart/form-data; boundary=${boundary}`);
  assert.deepEqual(receivedRequest.body, payload);
  assert.equal(response.statusCode, 201);
  assert.equal(response.headers.get("content-type"), "application/json");
  assert.deepEqual(
    Buffer.concat(response.chunks),
    Buffer.from(JSON.stringify({ success: true, file: { id: "test-file" } })),
  );
});
