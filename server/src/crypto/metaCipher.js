import crypto from "node:crypto";

export function encryptMetadata(value, key, fileId) {
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("chacha20-poly1305", key, nonce, {
    authTagLength: 16,
  });
  cipher.setAAD(Buffer.from(String(fileId), "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([nonce, ciphertext, cipher.getAuthTag()]).toString(
    "base64",
  );
}

export function decryptMetadata(encoded, key, fileId) {
  const value = Buffer.from(encoded, "base64");
  if (value.length < 28) throw new Error("Invalid metadata");
  const cipher = crypto.createDecipheriv(
    "chacha20-poly1305",
    key,
    value.subarray(0, 12),
    { authTagLength: 16 },
  );
  cipher.setAAD(Buffer.from(String(fileId), "utf8"));
  cipher.setAuthTag(value.subarray(-16));
  return JSON.parse(
    Buffer.concat([
      cipher.update(value.subarray(12, -16)),
      cipher.final(),
    ]).toString("utf8"),
  );
}
