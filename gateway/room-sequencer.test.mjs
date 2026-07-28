import test from "node:test";
import assert from "node:assert/strict";
import { RoomSequencer } from "./room-sequencer.mjs";

test("assigns monotonic revisions and returns missed operations", () => {
  const room = new RoomSequencer("book-1");
  const first = room.append({ operationId: "a", baseRevision: 0, type: "SET_RANGE", payload: {} });
  const second = room.append({ operationId: "b", baseRevision: 1, type: "SET_RANGE", payload: {} });

  assert.equal(first.revision, 1);
  assert.equal(second.revision, 2);
  assert.deepEqual(room.since(0).map((item) => item.operationId), ["a", "b"]);
});

test("deduplicates retried operation ids", () => {
  const room = new RoomSequencer("book-1");
  const first = room.append({ operationId: "same", baseRevision: 0, type: "SET_RANGE", payload: {} });
  const retry = room.append({ operationId: "same", baseRevision: 0, type: "SET_RANGE", payload: {} });
  assert.equal(retry.revision, first.revision);
  assert.equal(room.since(0).length, 1);
});
