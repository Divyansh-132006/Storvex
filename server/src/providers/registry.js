import { config } from "../config/env.js";
import FaultInjectionAdapter from "./FaultInjectionAdapter.js";
import GridFsProviderAdapter from "./GridFsProviderAdapter.js";
import S3CompatibleAdapter from "./S3CompatibleAdapter.js";

const retryOptions = { timeoutMs: config.providerTimeoutMs, maxRetries: config.providerMaxRetries };
const providers = [];
for (let index = 0; index < 5; index += 1) {
  const number = index + 1;
  const type = process.env[`PROVIDER_${number}_TYPE`] || "gridfs";
  if (!["gridfs", "s3"].includes(type)) throw new Error(`PROVIDER_${number}_TYPE must be gridfs or s3`);
  const adapter = type === "gridfs"
    ? new GridFsProviderAdapter(index, process.env[`PROVIDER_${number}_MONGODB_URI`] || config.mongoUri, retryOptions)
    : new S3CompatibleAdapter(index, {
        endpoint: process.env[`PROVIDER_${number}_ENDPOINT`],
        region: process.env[`PROVIDER_${number}_REGION`] || "us-east-1",
        bucket: process.env[`PROVIDER_${number}_BUCKET`],
        accessKeyId: process.env[`PROVIDER_${number}_ACCESS_KEY_ID`],
        secretAccessKey: process.env[`PROVIDER_${number}_SECRET_ACCESS_KEY`],
        forcePathStyle: process.env[`PROVIDER_${number}_FORCE_PATH_STYLE`] === "true",
      }, retryOptions);
  providers.push(new FaultInjectionAdapter(adapter, config.enableFaultInjection));
}
if (providers.length !== 5) throw new Error("Exactly five providers are required");

export default providers;
