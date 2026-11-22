export default class StorageAdapter {
  async putStream() {
    throw new Error("StorageAdapter.putStream must be implemented");
  }

  getStream() {
    throw new Error("StorageAdapter.getStream must be implemented");
  }

  async delete() {
    throw new Error("StorageAdapter.delete must be implemented");
  }

  async exists() {
    throw new Error("StorageAdapter.exists must be implemented");
  }
}
