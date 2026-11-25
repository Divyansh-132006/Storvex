import crypto from "node:crypto";

export default class ProviderAdapter {
  constructor(index, options = {}) {
    this.index = index;
    this.timeoutMs = options.timeoutMs;
    this.maxRetries = options.maxRetries;
    this.downUntil = 0;
    this.failureCount = 0;
    this.lastError = null;
  }

  async execute(operation) {
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      if (this.downUntil > Date.now()) throw new Error(`Provider ${this.index} is temporarily unavailable`);
      try {
        const result = await Promise.race([
          operation(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Provider operation timed out")), this.timeoutMs)),
        ]);
        this.failureCount = 0;
        this.downUntil = 0;
        return result;
      } catch (error) {
        lastError = error;
        this.lastError = error.message;
        this.failureCount += 1;
        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** attempt + crypto.randomInt(50)));
        }
      }
    }
    this.downUntil = Date.now() + Math.min(60_000, 1000 * 2 ** Math.min(this.failureCount, 6));
    throw lastError;
  }

  health() {
    return {
      index: this.index,
      state: this.downUntil > Date.now() ? "down" : "up",
      failureCount: this.failureCount,
      lastError: this.lastError,
    };
  }
}
