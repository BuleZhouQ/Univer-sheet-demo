import { createServer } from "node:http";
import { Server } from "socket.io";
import { RoomSequencer } from "./room-sequencer.mjs";
import { validateOperation } from "./protocol.mjs";
import { createOperationStore } from "./operation-store.mjs";

const port = Number(process.env.COLLAB_PORT || 3001);
const httpServer = createServer((_, response) => {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ ok: true, service: "univer-collaboration-gateway" }));
});
const io = new Server(httpServer, {
  path: "/socket.io",
  cors: { origin: true, credentials: true },
  maxHttpBufferSize: 5 * 1024 * 1024,
});
const rooms = new Map();
const selections = new Map();
const operationStore = await createOperationStore();
const roomState = (room) => {
  if (!rooms.has(room)) rooms.set(room, new RoomSequencer(room));
  return rooms.get(room);
};
const usersInRoom = async (room) => {
  const sockets = await io.in(room).fetchSockets();
  return sockets.map((socket) => ({ id: socket.id, user: socket.data.user }));
};

io.on("connection", (socket) => {
  socket.on("collab:join", async ({ room = "univer-demo", user = "访客", lastRevision = 0 } = {}, ack = () => {}) => {
    socket.data.room = String(room);
    socket.data.user = String(user);
    await socket.join(socket.data.room);
    const state = roomState(socket.data.room);
    ack({
      ok: true,
      revision: state.revision,
      operations: state.since(Number(lastRevision) || 0),
      users: await usersInRoom(socket.data.room),
      selections: [...selections.values()].filter((item) => item.room === socket.data.room),
    });
    io.to(socket.data.room).emit("collab:presence", { users: await usersInRoom(socket.data.room) });
  });

  socket.on("collab:operation", async (operation, ack = () => {}) => {
    const room = socket.data.room;
    const error = validateOperation(operation);
    if (!room || error) return ack({ ok: false, message: error || "join room first" });
    const accepted = roomState(room).append({ ...operation, user: socket.data.user });
    void operationStore.save(accepted).catch((reason) => console.error("operation persistence failed", reason));
    ack({ ok: true, revision: accepted.revision, operationId: accepted.operationId });
    socket.to(room).emit("collab:operation", accepted);
  });

  socket.on("collab:selection", (selection) => {
    const room = socket.data.room;
    if (!room || !selection || !Number.isInteger(selection.startRow) || !Number.isInteger(selection.startColumn)) return;
    const remoteSelection = {
      ...selection,
      room,
      userId: socket.id,
      userName: socket.data.user,
      updatedAt: Date.now(),
    };
    selections.set(socket.id, remoteSelection);
    socket.to(room).volatile.emit("collab:selection", remoteSelection);
  });

  socket.on("disconnect", async () => {
    const room = socket.data.room;
    selections.delete(socket.id);
    if (room) {
      io.to(room).emit("collab:selection-left", { userId: socket.id });
      io.to(room).emit("collab:presence", { users: await usersInRoom(room) });
    }
  });
});

httpServer.listen(port, () => console.log(`collaboration gateway listening on ${port}`));
