export default class FaultInjectionAdapter {
  constructor(adapter, enabled) {
    this.adapter = adapter;
    this.enabled = enabled;
    this.mode = "none";
  }

  setMode(mode) {
    if (!["offline", "corrupt", "slow", "none"].includes(mode)) throw new Error("Invalid fault mode");
    this.mode = mode;
  }

  async call(operation) {
    if (this.enabled && this.mode === "offline") throw new Error(`Provider ${this.adapter.index} is offline`);
    if (this.enabled && this.mode === "slow") await new Promise((resolve) => setTimeout(resolve, 1000));
    return operation();
  }

  putObject(...args) { return this.call(() => this.adapter.putObject(...args)); }
  deleteObject(...args) { return this.call(() => this.adapter.deleteObject(...args)); }
  exists(...args) { return this.call(() => this.adapter.exists(...args)); }
  healthCheck(...args) { return this.call(() => this.adapter.healthCheck(...args)); }
  health() { return { ...this.adapter.health(), faultMode: this.enabled ? this.mode : "disabled" }; }

  async getObject(...args) {
    const result = await this.call(() => this.adapter.getObject(...args));
    if (this.enabled && this.mode === "corrupt" && result.length) {
      const corrupted = Buffer.from(result);
      corrupted[0] ^= 1;
      return corrupted;
    }
    return result;
  }
}
