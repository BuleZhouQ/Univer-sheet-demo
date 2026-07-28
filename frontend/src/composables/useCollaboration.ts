import { computed, ref, shallowRef } from "vue";
import { io, type Socket } from "socket.io-client";
import type { UniverWorkbookAdapter } from "../adapters/univer-workbook-adapter";
import type { CollaborationOperation, RangeOperationPayload } from "../models/collaboration";
import type { RemoteSelection } from "../models/collaboration";

export function colorForUser(user: string) {
  const colors = ["#2563EB", "#DC2626", "#059669", "#7C3AED", "#D97706", "#DB2777", "#0891B2"];
  let hash = 0;
  for (const character of user) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

export function useCollaboration(adapter: () => UniverWorkbookAdapter | undefined) {
  const socket = shallowRef<Socket>();
  const connected = ref(false);
  const revision = ref(0);
  const users = ref<Array<{ id: string; user: string }>>([]);
  const error = ref("");
  let disposeChangeListener: (() => void) | undefined;
  let disposeSelectionListener: (() => void) | undefined;
  let selectionTimer = 0;

  const apply = async (operation: CollaborationOperation) => {
    await adapter()?.applyRemoteRange(operation.payload);
    revision.value = Math.max(revision.value, operation.revision ?? revision.value);
  };

  const publish = (payload: RangeOperationPayload) => {
    const operation: CollaborationOperation = {
      operationId: crypto.randomUUID(),
      type: "SET_RANGE",
      baseRevision: revision.value,
      payload,
    };
    socket.value?.emit("collab:operation", operation, (response: { ok: boolean; revision?: number; message?: string }) => {
      if (response.ok && response.revision !== undefined) revision.value = response.revision;
      else error.value = response.message || "协同操作发送失败";
    });
  };

  const connect = (room: string, user: string) => {
    socket.value?.disconnect();
    const client = io({ path: "/socket.io", transports: ["websocket"], reconnection: true });
    socket.value = client;
    client.on("connect", () => {
      client.emit("collab:join", { room, user, lastRevision: revision.value }, async (response: any) => {
        if (!response.ok) { error.value = response.message || "加入房间失败"; return; }
        for (const operation of response.operations ?? []) await apply(operation);
        revision.value = response.revision;
        users.value = response.users ?? [];
        for (const selection of response.selections ?? []) adapter()?.setRemoteSelection(selection);
        connected.value = true;
        error.value = "";
      });
    });
    client.on("collab:operation", (operation: CollaborationOperation) => void apply(operation));
    client.on("collab:presence", (message: { users: Array<{ id: string; user: string }> }) => users.value = message.users);
    client.on("collab:selection", (selection: RemoteSelection) => adapter()?.setRemoteSelection(selection));
    client.on("collab:selection-left", ({ userId }: { userId: string }) => adapter()?.removeRemoteSelection(userId));
    client.on("disconnect", () => connected.value = false);
    client.on("connect_error", (reason) => error.value = reason.message);
    disposeChangeListener?.();
    disposeChangeListener = adapter()?.onRangeChanged(publish);
    disposeSelectionListener?.();
    disposeSelectionListener = adapter()?.onSelectionChanged((selection) => {
      window.clearTimeout(selectionTimer);
      selectionTimer = window.setTimeout(() => {
        client.volatile.emit("collab:selection", { ...selection, color: colorForUser(user) });
      }, 40);
    });
  };

  const disconnect = () => {
    disposeChangeListener?.();
    disposeSelectionListener?.();
    window.clearTimeout(selectionTimer);
    socket.value?.disconnect();
    connected.value = false;
  };

  return {
    connected, revision, users, error, connect, disconnect,
    status: computed(() => error.value || (connected.value ? `${users.value.length} 人在线 · r${revision.value}` : "协同连接中")),
  };
}
