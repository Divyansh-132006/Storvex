import crypto from "node:crypto";
import { Transform } from "node:stream";
import { config } from "../config/env.js";

const TAG_SIZE = 16;
const NONCE_SIZE = 12;

function nonce(index) {
  const value = Buffer.alloc(NONCE_SIZE);
  value.writeBigUInt64BE(BigInt(index), 4);
  return value;
}

function aad(fileId, index, final) {
  const id = Buffer.from(String(fileId), "utf8");
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(index));
  return Buffer.concat([id, counter, Buffer.from([final ? 1 : 0])]);
}

function encryptUnit(data, key, fileId, index, final) {
  const cipher = crypto.createCipheriv("chacha20-poly1305", key, nonce(index), {
    authTagLength: TAG_SIZE,
  });
  cipher.setAAD(aad(fileId, index, final));
  return Buffer.concat([
    cipher.update(data),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
}

function decryptUnit(data, key, fileId, index, final) {
  if (data.length < TAG_SIZE) throw new Error("Invalid encrypted unit");
  const cipher = crypto.createDecipheriv(
    "chacha20-poly1305",
    key,
    nonce(index),
    { authTagLength: TAG_SIZE },
  );
  cipher.setAAD(aad(fileId, index, final));
  cipher.setAuthTag(data.subarray(-TAG_SIZE));
  return Buffer.concat([
    cipher.update(data.subarray(0, -TAG_SIZE)),
    cipher.final(),
  ]);
}

export function createEncryptStream({ key, fileId }) {
  let pending = Buffer.alloc(0);
  let index = 0;
  return new Transform({
    transform(chunk, encoding, callback) {
      try {
        pending = Buffer.concat([
          pending,
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding),
        ]);
        while (pending.length > config.unitSize) {
          this.push(
            encryptUnit(
              pending.subarray(0, config.unitSize),
              key,
              fileId,
              index++,
              false,
            ),
          );
          pending = pending.subarray(config.unitSize);
        }
        callback();
      } catch (error) {
        callback(error);
      }
    },
    flush(callback) {
      try {
        this.push(encryptUnit(pending, key, fileId, index, true));
        callback();
      } catch (error) {
        callback(error);
      }
    },
  });
}

export function createDecryptStream({ key, fileId, unitCount }) {
  let pending = Buffer.alloc(0);
  let index = 0;
  return new Transform({
    transform(chunk, encoding, callback) {
      try {
        pending = Buffer.concat([
          pending,
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding),
        ]);
        const fullSize = config.unitSize + TAG_SIZE;
        while (index < unitCount - 1 && pending.length >= fullSize) {
          this.push(
            decryptUnit(
              pending.subarray(0, fullSize),
              key,
              fileId,
              index++,
              false,
            ),
          );
          pending = pending.subarray(fullSize);
        }
        callback();
      } catch (error) {
        callback(error);
      }
    },
    flush(callback) {
      try {
        if (index !== unitCount - 1 || pending.length < TAG_SIZE)
          throw new Error("Invalid encrypted file");
        this.push(decryptUnit(pending, key, fileId, index, true));
        callback();
      } catch (error) {
        callback(error);
      }
    },
  });
}

export { TAG_SIZE };
