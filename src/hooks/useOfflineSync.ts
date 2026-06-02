import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useOfflineStore } from '../stores/offlineStore';

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const { setOnline, setSynced, isOnline } = useOfflineStore();
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setOnline(connected);
      if (connected) {
        queryClient.invalidateQueries();
        setSynced();
        setLastSync(new Date());
      }
    });
    return () => unsub();
  }, []);

  return { isOnline, lastSync };
}
