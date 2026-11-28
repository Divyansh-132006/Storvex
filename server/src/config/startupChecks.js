const providerValue = (env, name) => String(env[name] || "").trim();

export function assertStorageProviderConfig(env = process.env) {
  if (env.NODE_ENV !== "production") return;

  const simulatedAllowed = env.ALLOW_SIMULATED_PROVIDERS === "true";
  for (let number = 1; number <= 5; number += 1) {
    const name = `PROVIDER_${number}_TYPE`;
    const type = providerValue(env, name).toLowerCase();
    if (!type) {
      throw new Error(`Missing required production environment variable: ${name}`);
    }
    if (!["s3", "gridfs"].includes(type)) {
      throw new Error(`${name} must be s3 or gridfs`);
    }
    if (type === "gridfs" && !simulatedAllowed) {
      throw new Error(
        `${name}=gridfs is simulated storage; set ALLOW_SIMULATED_PROVIDERS=true only for an intentional simulation`,
      );
    }
    if (type === "s3") {
      if (!providerValue(env, `PROVIDER_${number}_BUCKET`)) {
        throw new Error(`Missing required production environment variable: PROVIDER_${number}_BUCKET`);
      }
      const accessKey = providerValue(env, `PROVIDER_${number}_ACCESS_KEY_ID`);
      const secretKey = providerValue(env, `PROVIDER_${number}_SECRET_ACCESS_KEY`);
      if (Boolean(accessKey) !== Boolean(secretKey)) {
        throw new Error(`PROVIDER_${number} must configure both S3 credentials or neither`);
      }
    }
  }
}

function providerFailureDomain(env, number) {
  const type = providerValue(env, `PROVIDER_${number}_TYPE`).toLowerCase() || "gridfs";
  if (type === "gridfs") {
    return `gridfs|${providerValue(env, `PROVIDER_${number}_MONGODB_URI`) || providerValue(env, "MONGODB_URI")}`;
  }
  const region = providerValue(env, `PROVIDER_${number}_REGION`) || "us-east-1";
  const endpoint = providerValue(env, `PROVIDER_${number}_ENDPOINT`) || `aws:${region}`;
  const account = providerValue(env, `PROVIDER_${number}_ACCOUNT_ID`) ||
    providerValue(env, `PROVIDER_${number}_ACCESS_KEY_ID`) ||
    "<default-credentials>";
  return `s3|${endpoint}|${account}`;
}

export function warnForSharedProviderFailureDomains(env = process.env, warn = console.warn) {
  const domains = new Map();
  for (let number = 1; number <= 5; number += 1) {
    const key = providerFailureDomain(env, number);
    const numbers = domains.get(key) || [];
    numbers.push(number);
    domains.set(key, numbers);
  }
  for (const numbers of domains.values()) {
    if (numbers.length > 1) {
      warn(
        `WARNING: providers ${numbers.join(", ")} share an endpoint and account; they are not independent failure domains`,
      );
    }
  }
}
