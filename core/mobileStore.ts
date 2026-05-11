import websocketService from "@/services/websocket.service";
import type {
  RealtimeEventName,
  RealtimeSubscription,
} from "@/types/realtime.types";
import { create } from "zustand";
import useCommunityStore from "./communityState";

type RealtimeStatus = "idle" | "connecting" | "connected" | "error";

type MobileStoreState = {
  realtimeStatus: RealtimeStatus;
  realtimeError: string | null;
  subscriptionCounts: Record<string, number>;
  startRealtime: () => Promise<void>;
  stopRealtime: () => void;
  subscribeCommunityRoom: (
    communityId: string,
    viewerUserId: string,
  ) => Promise<void>;
  unsubscribeCommunityRoom: (communityId: string) => void;
  resetRealtime: () => void;
};

let unbindRealtimeEvents: (() => void) | null = null;

function subscriptionKey(subscription: RealtimeSubscription): string {
  return `${subscription.channel}:${subscription.id}`;
}

function isRealtimeEventName(event: string): event is RealtimeEventName {
  return (
    event === "realtime.connected" ||
    event === "subscription.ready" ||
    event === "subscription.error" ||
    event === "community.room.user_joined" ||
    event === "community.room.user_left" ||
    event === "community.message.created" ||
    event === "community.message.deleted" ||
    event === "community.typing.started" ||
    event === "community.typing.stopped" ||
    event === "community.reaction.updated"
  );
}

const useMobileStore = create<MobileStoreState>((set, get) => ({
  realtimeStatus: "idle",
  realtimeError: null,
  subscriptionCounts: {},

  startRealtime: async () => {
    if (get().realtimeStatus === "connecting" || websocketService.isConnected()) {
      return;
    }

    set({ realtimeStatus: "connecting", realtimeError: null });
    try {
      await websocketService.connect();
      if (!unbindRealtimeEvents) {
        unbindRealtimeEvents = websocketService.onAny((event, payload) => {
          if (!isRealtimeEventName(event)) {
            if (__DEV__) {
              console.warn("Unknown realtime event ignored:", event);
            }
            return;
          }

          if (event.startsWith("community.") || event === "subscription.ready") {
            useCommunityStore
              .getState()
              .handleCommunityRealtimeEvent(event, payload);
          }

          if (event === "realtime.connected") {
            set({ realtimeStatus: "connected", realtimeError: null });
            const subscriptions = Object.keys(get().subscriptionCounts)
              .filter((key) => get().subscriptionCounts[key] > 0)
              .map((key) => {
                const [channel, id] = key.split(":");
                return { channel, id } as RealtimeSubscription;
              });
            subscriptions.forEach((subscription) => {
              websocketService.subscribe(subscription);
            });
          }
        });
      }
      set({ realtimeStatus: "connected", realtimeError: null });
    } catch (error) {
      set({
        realtimeStatus: "error",
        realtimeError:
          error instanceof Error ? error.message : "Failed to connect realtime",
      });
      throw error;
    }
  },

  stopRealtime: () => {
    unbindRealtimeEvents?.();
    unbindRealtimeEvents = null;
    websocketService.disconnect();
    set({ realtimeStatus: "idle", realtimeError: null });
  },

  subscribeCommunityRoom: async (communityId, viewerUserId) => {
    useCommunityStore
      .getState()
      .subscribeCommunityRoomRealtime(communityId, viewerUserId);

    const subscription: RealtimeSubscription = {
      channel: "community.room",
      id: communityId,
    };
    const key = subscriptionKey(subscription);
    const prevCount = get().subscriptionCounts[key] ?? 0;

    set((state) => ({
      subscriptionCounts: {
        ...state.subscriptionCounts,
        [key]: prevCount + 1,
      },
    }));

    await get().startRealtime();
    if (prevCount === 0) {
      websocketService.subscribe(subscription);
    }
  },

  unsubscribeCommunityRoom: (communityId) => {
    const subscription: RealtimeSubscription = {
      channel: "community.room",
      id: communityId,
    };
    const key = subscriptionKey(subscription);
    const prevCount = get().subscriptionCounts[key] ?? 0;
    const nextCount = Math.max(0, prevCount - 1);

    if (nextCount === 0) {
      websocketService.unsubscribe(subscription);
      useCommunityStore.getState().unsubscribeCommunityRoomRealtime(communityId);
      set((state) => {
        const { [key]: _removed, ...rest } = state.subscriptionCounts;
        return { subscriptionCounts: rest };
      });
      return;
    }

    set((state) => ({
      subscriptionCounts: {
        ...state.subscriptionCounts,
        [key]: nextCount,
      },
    }));
  },

  resetRealtime: () => {
    get().stopRealtime();
    set({ subscriptionCounts: {} });
  },
}));

export default useMobileStore;
