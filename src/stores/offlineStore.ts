import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

interface OfflineState {
  isOnline: boolean;
  lastSynced: Date | null;
  pendingActions: number;
  setOnline: (status: boolean) => void;
  setSynced: () => void;
  addPendingAction: () => void;
  clearPendingActions: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: true,
  lastSynced: null,
  pendingActions: 0,

  setOnline: (status: boolean) => set({ isOnline: status }),
  setSynced: () => set({ lastSynced: new Date(), pendingActions: 0 }),
  addPendingAction: () => set((s) => ({ pendingActions: s.pendingActions + 1 })),
  clearPendingActions: () => set({ pendingActions: 0 }),
}));

export function useNetworkListener() {
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      useOfflineStore.getState().setOnline(state.isConnected ?? false);
      if (state.isConnected) {
        useOfflineStore.getState().setSynced();
      }
    });
    return () => unsub();
  }, []);
}
