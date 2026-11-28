import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import ProviderAdapter from "./ProviderAdapter.js";

export default class S3CompatibleAdapter extends ProviderAdapter {
  constructor(index, options, retryOptions) {
    super(index, retryOptions);
    this.bucket = options.bucket;
    this.client = new S3Client({
      endpoint: options.endpoint || undefined,
      region: options.region,
      forcePathStyle: options.forcePathStyle,
      credentials: options.accessKeyId && options.secretAccessKey
        ? { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey }
        : undefined,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }

  async putObject(objectKey, buffer) {
    return this.execute(async () => {
      await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: objectKey, Body: buffer, ContentLength: buffer.length }));
      return { size: buffer.length };
    });
  }

  async getObject(objectKey) {
    return this.execute(async () => {
      const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }));
      const chunks = [];
      for await (const chunk of response.Body) chunks.push(chunk);
      return Buffer.concat(chunks);
    });
  }

  async deleteObject(objectKey) {
    return this.execute(() => this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey })));
  }

  async exists(objectKey) {
    return this.execute(async () => {
      try {
        await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }));
        return true;
      } catch (error) {
        if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) return false;
        throw error;
      }
    });
  }

  async healthCheck() {
    return this.execute(() => Promise.resolve(true));
  }
}
