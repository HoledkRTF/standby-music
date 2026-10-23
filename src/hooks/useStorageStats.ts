'use client';

import { useState, useEffect } from 'react';
import { useSync } from '@/context/SyncContext';
import { getAllCachedFiles } from '@/lib/db';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function useStorageStats() {
  const [stats, setStats] = useState({ totalBytes: 0, photos: 0, videos: 0, docs: 0, formatted: '0 B' });
  const [loading, setLoading] = useState(true);
  const [fileCount, setFileCount] = useState(0);
  
  const { isFullySynced, syncedCount } = useSync();

  useEffect(() => {
    let isMounted = true;
    
    async function calculateStats() {
      setLoading(true);
      try {
        const allFiles = await getAllCachedFiles('date-desc');
        let total = 0;
        let p = 0;
        let v = 0;
        let d = 0;

        for (const file of allFiles) {
          total += (file.size || 0);
          if (file.type === 'photo') p += (file.size || 0);
          else if (file.type === 'video') v += (file.size || 0);
          else d += (file.size || 0);
        }

        if (isMounted) {
          setStats({
            totalBytes: total,
            photos: p,
            videos: v,
            docs: d,
            formatted: formatBytes(total)
          });
          setFileCount(allFiles.length);
        }
      } catch (e) {
        console.error("Failed to calculate storage stats", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (isFullySynced) {
      calculateStats();
    }
    
    return () => { isMounted = false; };
  }, [isFullySynced, syncedCount]);

  return { ...stats, loading, isFullySynced, fileCount };
}
