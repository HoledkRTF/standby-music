'use client';

import { useState, useEffect, useRef } from 'react';
import { TelegramClient, Api } from 'telegram';
import { getSavedMessages, parseMediaMeta, getFileSize, getRawFileSize } from '@/lib/telegram';
import { getSyncState, setSyncState, saveFilesToCache, TelegramFileMeta } from '@/lib/db';
import { useTelegram } from '@/context/TelegramContext';

export function useSyncEngine() {
  const { client, isAuthenticated } = useTelegram();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const [isFullySynced, setIsFullySynced] = useState(false);
  const syncLock = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !client || syncLock.current) return;

    let isMounted = true;
    
    async function runSync() {
      if (!client) return;
      syncLock.current = true;
      setIsSyncing(true);

      try {
        const lastSyncedId = (await getSyncState('last_synced_id')) || 0;
        let currentOffsetId = 0;
        let keepFetching = true;
        let totalFetchedInSession = 0;
        let maxSeenId = 0;

        while (keepFetching && isMounted) {
          const msgs = await getSavedMessages(client, 100, currentOffsetId);
          
          if (msgs.length === 0) {
            keepFetching = false;
            break;
          }

          const filesToSave: TelegramFileMeta[] = [];
          let reachedLastSynced = false;

          for (const m of msgs) {
            if (m.id <= lastSyncedId) {
              reachedLastSynced = true;
              break; // Stop processing older messages
            }

            if (m.id > maxSeenId) maxSeenId = m.id;

            // Only process file messages
            if (m.message?.includes('#unlim_metadata')) continue;
            const { fileName, type } = parseMediaMeta(m as Api.Message);
            if (type !== 'document' && type !== 'photo' && type !== 'video' && type !== 'audio') continue;
            
            // Get size accurately
            const size = getRawFileSize(m as Api.Message);

            filesToSave.push({
              id: m.id,
              fileName,
              size,
              date: m.date,
              type: type as any
            });
          }

          if (filesToSave.length > 0) {
            await saveFilesToCache(filesToSave);
            totalFetchedInSession += filesToSave.length;
            setSyncedCount(prev => prev + filesToSave.length);
          }

          if (reachedLastSynced || msgs.length < 100) {
            keepFetching = false;
            break;
          }

          currentOffsetId = msgs[msgs.length - 1].id;
          
          // Sleep to prevent FloodWait if we are scanning history
          await new Promise(r => setTimeout(r, 1500));
        }

        // If we fetched new things, update the high water mark
        if (maxSeenId > lastSyncedId) {
          await setSyncState('last_synced_id', maxSeenId);
        }
        
        if (isMounted) setIsFullySynced(true);

      } catch (e) {
        console.error("Sync Engine Error:", e);
      } finally {
        if (isMounted) setIsSyncing(false);
        syncLock.current = false;
      }
    }

    runSync();

    return () => { isMounted = false; };
  }, [client, isAuthenticated]);

  return { isSyncing, syncedCount, isFullySynced };
}
