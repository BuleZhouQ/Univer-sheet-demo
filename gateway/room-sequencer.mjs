export class RoomSequencer {
  constructor(roomId, maxOperations = 5000) {
    this.roomId = roomId;
    this.maxOperations = maxOperations;
    this.revision = 0;
    this.operations = [];
    this.byId = new Map();
  }

  append(operation) {
    const existing = this.byId.get(operation.operationId);
    if (existing) return existing;
    const accepted = { ...operation, roomId: this.roomId, revision: ++this.revision, acceptedAt: Date.now() };
    this.operations.push(accepted);
    this.byId.set(accepted.operationId, accepted);
    while (this.operations.length > this.maxOperations) {
      const removed = this.operations.shift();
      this.byId.delete(removed.operationId);
    }
    return accepted;
  }

  since(revision) {
    return this.operations.filter((operation) => operation.revision > revision);
  }
}
