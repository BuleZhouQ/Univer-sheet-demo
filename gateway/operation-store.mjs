import { MongoClient } from "mongodb";

export async function createOperationStore(uri = process.env.MONGODB_URI) {
  if (!uri) return { save: async () => {} };
  const client = new MongoClient(uri);
  await client.connect();
  const operations = client.db().collection("collaboration_operations");
  await operations.createIndex({ roomId: 1, revision: 1 }, { unique: true });
  await operations.createIndex({ roomId: 1, operationId: 1 }, { unique: true });
  return {
    save: async (operation) => {
      await operations.updateOne(
        { roomId: operation.roomId, operationId: operation.operationId },
        { $setOnInsert: operation },
        { upsert: true },
      );
    },
  };
}
