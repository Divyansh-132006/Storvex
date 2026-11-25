import mongoose from "mongoose";
import { Readable } from "node:stream";
import ProviderAdapter from "./ProviderAdapter.js";

export default class GridFsProviderAdapter extends ProviderAdapter {
  constructor(index, uri, options) {
    super(index, options);
    this.connection = mongoose.createConnection(uri);
    this.bucket = null;
  }

  async getBucket() {
    await this.connection.asPromise();
    if (!this.bucket) this.bucket = new mongoose.mongo.GridFSBucket(this.connection.db, { bucketName: `provider${this.index + 1}` });
    return this.bucket;
  }

  async putObject(objectKey, buffer) {
    return this.execute(async () => {
      const bucket = await this.getBucket();
      await new Promise((resolve, reject) => {
        const upload = bucket.openUploadStream(objectKey);
        upload.once("error", reject);
        upload.once("finish", resolve);
        Readable.from([buffer]).pipe(upload);
      });
      return { size: buffer.length };
    });
  }

  async getObject(objectKey) {
    return this.execute(async () => {
      const bucket = await this.getBucket();
      const chunks = [];
      for await (const chunk of bucket.openDownloadStreamByName(objectKey)) chunks.push(chunk);
      return Buffer.concat(chunks);
    });
  }

  async deleteObject(objectKey) {
    return this.execute(async () => {
      const bucket = await this.getBucket();
      const files = await bucket.find({ filename: objectKey }).toArray();
      await Promise.all(files.map((file) => bucket.delete(file._id)));
    });
  }

  async exists(objectKey) {
    return this.execute(async () => Boolean((await (await this.getBucket()).find({ filename: objectKey }).limit(1).toArray()).length));
  }

  async healthCheck() {
    return this.execute(async () => {
      await this.getBucket();
      return true;
    });
  }
}
