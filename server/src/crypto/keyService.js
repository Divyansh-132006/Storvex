import crypto from "node:crypto";
import { config } from "../config/env.js";

function masterKey(version) {
  const key = config.masterKeys.get(Number(version));
  if (!key) throw new Error("Unsupported encryption key version");
  return key;
}

export function getCurrentKeyVersion() {
  return config.currentKeyVersion;
}

export function deriveFileKey(
  fileId,
  fileSalt,
  version = config.currentKeyVersion,
) {
  return Buffer.from(
    crypto.hkdfSync(
      "sha256",
      masterKey(version),
      fileSalt,
      `ufds-file-v1:${fileId}`,
      32,
    ),
  );
}

export function deriveMetaKey(
  fileId,
  fileSalt,
  version = config.currentKeyVersion,
) {
  return Buffer.from(
    crypto.hkdfSync(
      "sha256",
      masterKey(version),
      fileSalt,
      `ufds-meta-v1:${fileId}`,
      32,
    ),
  );
}
