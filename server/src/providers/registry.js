import { config } from "../config/env.js";
import FaultInjectionAdapter from "./FaultInjectionAdapter.js";
import GridFsProviderAdapter from "./GridFsProviderAdapter.js";
import S3CompatibleAdapter from "./S3CompatibleAdapter.js";
import { assertStorageProviderConfig, warnForSharedProviderFailureDomains } from "../config/startupChecks.js";

const retryOptions = { timeoutMs: config.providerTimeoutMs, maxRetries: config.providerMaxRetries };
const providers = [];
assertStorageProviderConfig(process.env);
warnForSharedProviderFailureDomains(process.env);

const value = (name) => {
  const raw = process.env[name]?.trim() || "";
  if (raw.length >= 2 && raw[0] === raw[raw.length - 1] && ["'", "\""].includes(raw[0])) {
    return raw.slice(1, -1).trim();
  }
  return raw;
};

for (let index = 0; index < 5; index += 1) {
  const number = index + 1;
  const type = (value(`PROVIDER_${number}_TYPE`) || "gridfs").toLowerCase();
  if (!["gridfs", "s3"].includes(type)) throw new Error(`PROVIDER_${number}_TYPE must be gridfs or s3`);
  const adapter = type === "gridfs"
    ? new GridFsProviderAdapter(index, value(`PROVIDER_${number}_MONGODB_URI`) || config.mongoUri, retryOptions)
    : new S3CompatibleAdapter(index, {
        endpoint: value(`PROVIDER_${number}_ENDPOINT`),
        region: value(`PROVIDER_${number}_REGION`) || "us-east-1",
        bucket: value(`PROVIDER_${number}_BUCKET`),
        accessKeyId: value(`PROVIDER_${number}_ACCESS_KEY_ID`),
        secretAccessKey: value(`PROVIDER_${number}_SECRET_ACCESS_KEY`),
        forcePathStyle: value(`PROVIDER_${number}_FORCE_PATH_STYLE`) === "true",
      }, retryOptions);
  providers.push(new FaultInjectionAdapter(adapter, config.enableFaultInjection));
}
if (providers.length !== 5) throw new Error("Exactly five providers are required");

export default providers;
