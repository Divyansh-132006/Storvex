import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import StorageAdapter from "./StorageAdapter.js";
import { config } from "../config/env.js";

function safePath(root, storageKey) {
  if (!/^[a-f0-9]{32,128}$/.test(storageKey))
    throw new Error("Invalid storage key");
  return path.join(root, storageKey);
}

export default class LocalDiskAdapter extends StorageAdapter {
  constructor(root = config.storageDir) {
    super();
    this.root = path.resolve(root);
  }

  async putStream(storageKey, readable) {
    await fsp.mkdir(this.root, { recursive: true });
    const target = safePath(this.root, storageKey);
    const temporary = `${target}.${crypto.randomBytes(8).toString("hex")}.part`;
    let size = 0;
    const hash = crypto.createHash("sha256");
    const transform = new (await import("node:stream")).Transform({
      transform(chunk, encoding, callback) {
        size += chunk.length;
        hash.update(chunk);
        callback(null, chunk);
      },
    });
    try {
      await pipeline(
        readable,
        transform,
        fs.createWriteStream(temporary, { flags: "wx" }),
      );
      await fsp.rename(temporary, target);
      return { size, sha256: hash.digest("hex") };
    } catch (error) {
      await fsp.rm(temporary, { force: true });
      throw error;
    }
  }

  getStream(storageKey) {
    return fs.createReadStream(safePath(this.root, storageKey));
  }

  async delete(storageKey) {
    await fsp.rm(safePath(this.root, storageKey), { force: true });
  }

  async exists(storageKey) {
    try {
      await fsp.access(safePath(this.root, storageKey));
      return true;
    } catch (error) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
  }
}
