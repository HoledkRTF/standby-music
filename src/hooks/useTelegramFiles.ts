import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Api, TelegramClient } from 'telegram';
import { getSavedMessages, parseMediaMeta, getRecentGlobalMedia, getMessagesFromPeer } from '@/lib/telegram';
import { useTags } from '@/context/TagsContext';
import { useTelegram } from '@/context/TelegramContext';
import { systemThumbnailMap } from '@/lib/thumbnailStore';

export interface FileFilterConfig {
  type?: 'photo' | 'video' | 'audio' | 'document' | 'all';
  excludeType?: string[];
  tag?: string;
  isTrash?: boolean;
  untaggedOnly?: boolean;
  search?: string;
}

export function useTelegramFiles(
  client: TelegramClient | null, 
  isAuthenticated: boolean, 
  filterConfig: FileFilterConfig,
  dependency: any = null,
  sortOrder: 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc' | 'name-asc' | 'name-desc' = 'date-desc',
  source: 'saved' | 'recent' | string = 'saved'
) {
  const { getAllTagsMap, version } = useTags();
  const { currentUser } = useTelegram();

  const [messages, setMessages] = useState<Api.Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [lastFetchedId, setLastFetchedId] = useState<number | null>(null);
  const globalOffsetsRef = useRef<Record<string, any>>({});
  const loadingMoreRef = useRef(false);
  const LIMIT = 50;

  // Reset feed when filters change
  useEffect(() => {
    setLastFetchedId(null);
    globalOffsetsRef.current = {};
    setHasMore(true);
  }, [sortOrder, filterConfig.type, filterConfig.tag, filterConfig.isTrash, filterConfig.untaggedOnly, filterConfig.search, dependency, source]);

  const allUniqueTags = useMemo(() => {
    return Array.from(new Set(Object.values(getAllTagsMap()).flat().map(t => t.toLowerCase())));
  }, [getAllTagsMap, version]);

  const fetchMessages = useCallback(async (offsetId = 0) => {
    if (!client) return;
    
    if (offsetId === 0) setLoading(true);
    else {
      setLoadingMore(true);
      loadingMoreRef.current = true;
    }

    try {
      const isReverse = sortOrder === 'date-asc';
      // If fetching oldest first, and offset is 0, we pass 1 to get from the very beginning
      const fetchOffset = (offsetId === 0 && isReverse) ? 1 : offsetId;
      
      let finalFiles: Api.Message[] = [];
      let currentFetchOffset = (offsetId === 0 && isReverse) ? 1 : offsetId;
      let newGlobalOffsets = { ...globalOffsetsRef.current };
      let newHasMore = true;
      let iterations = 0;
      let lastFetchedIdLocal: number | null = null;
      const isRecentSource = source === 'recent';
      
      let exactTagMatches: string[] = [];
      if (filterConfig.search) {
         const queries = filterConfig.search.toLowerCase().split(' ').filter(q => q.trim().length > 0);
         const currentAllUniqueTags = Array.from(new Set(Object.values(getAllTagsMap()).flat().map(t => t.toLowerCase())));
         exactTagMatches = queries.filter(q => currentAllUniqueTags.includes(q));
      }
      
      const isTagSearch = !!filterConfig.tag || filterConfig.isTrash !== undefined || exactTagMatches.length > 0;
      let targetIdsToFetch: number[] | null = null;
      
      // OPTIMIZATION: If we are searching for tags and we are NOT in the recent tab (which spans all chats),
      // we can literally just ask our tags database for the exact message IDs and fetch ONLY those IDs!
      if (isTagSearch && !isRecentSource) {
        const localMatches = Object.entries(getAllTagsMap())
          .filter(([id, tags]) => {
            const lowerTags = tags.map(t => t.toLowerCase());
            if (filterConfig.tag && !lowerTags.includes(filterConfig.tag.toLowerCase())) return false;
            
            if (filterConfig.isTrash !== undefined) {
              const hasTrash = lowerTags.includes('trash');
              if (filterConfig.isTrash && !hasTrash) return false;
              if (!filterConfig.isTrash && hasTrash) return false;
            } else if (lowerTags.includes('trash')) {
              return false;
            }
            
            if (filterConfig.untaggedOnly) {
              const userTags = lowerTags.filter(t => t !== 'untagged' && !t.startsWith('hash_') && !t.startsWith('vhash_'));
              if (userTags.length > 0) return false;
            }
            
            if (exactTagMatches.length > 0) {
               // Must match at least one exact tag from the search query
               if (!exactTagMatches.some(tag => lowerTags.includes(tag))) {
                  return false;
               }
            }
            
            return true;
          })
          .map(([id]) => Number(id))
          .filter(id => !isNaN(id) && id > 0)
          .sort((a, b) => isReverse ? a - b : b - a);
          
        // Fallback to native search if no local tags match (except for untagged/trash which are purely local)
        if (localMatches.length > 0 || filterConfig.untaggedOnly || filterConfig.isTrash !== undefined) {
          targetIdsToFetch = localMatches;
        }
      }

      const maxIterations = 20; // Increased to 20 for faster linear scanning
      while (finalFiles.length < LIMIT && newHasMore && iterations < maxIterations) {
        iterations++;
        let msgs: any[] = [];
        
        if (targetIdsToFetch) {
          // If we have an exact list of IDs, we chunk them and fetch
          let startIndex = 0;
          if (currentFetchOffset !== (isReverse ? 1 : 0)) {
            // Try exact match first
            startIndex = targetIdsToFetch.findIndex(id => id === currentFetchOffset);
            if (startIndex !== -1) {
              startIndex++;
            } else {
              // If the exact ID is missing (e.g. untagged or deleted), find the next logical ID
              startIndex = targetIdsToFetch.findIndex(id => isReverse ? id > currentFetchOffset : id < currentFetchOffset);
              if (startIndex === -1) startIndex = targetIdsToFetch.length; // Exhausted
            }
          }
          
          const idsChunk = targetIdsToFetch.slice(startIndex, startIndex + 100);
          if (idsChunk.length === 0) {
            newHasMore = false;
            break;
          }
          
          try {
            const result = await client.getMessages(source === 'saved' ? 'me' : source, { ids: idsChunk });
            // getMessages with ids returns an array where missing messages are empty/undefined
            msgs = result.filter((m: any) => m && m.id && m.className === 'Message');
            // Sort msgs to strictly match the order of idsChunk so pagination advances correctly!
            msgs.sort((a, b) => {
              const indexA = idsChunk.indexOf(a.id);
              const indexB = idsChunk.indexOf(b.id);
              return indexA - indexB;
            });
          } catch(e) {
             console.error("ID Fetch error:", e);
             newHasMore = false;
          }
          
          currentFetchOffset = idsChunk[idsChunk.length - 1]; // Advance offset to the end of the chunk
          
        } else {
          // Normal history fetching
          if (source === 'saved') {
            msgs = await getSavedMessages(client, LIMIT, currentFetchOffset, isReverse, filterConfig.search);
          } else if (isRecentSource) {
            const result = await getRecentGlobalMedia(client, LIMIT, currentFetchOffset === 0 ? {} : newGlobalOffsets, currentUser?.userId);
            msgs = result.messages;
            newGlobalOffsets = result.offsets;
            newHasMore = result.hasMore;
          } else {
            msgs = await getMessagesFromPeer(client, source, LIMIT, currentFetchOffset, filterConfig.search);
          }
          
          if (!isRecentSource && msgs.length > 0) {
            currentFetchOffset = msgs[msgs.length - 1].id;
          }
        }
        
        const files = msgs.filter(m => {
          if (m.message?.includes('#unlim_metadata')) return false;

          const replyToMsgId = m.replyTo ? (m.replyTo as any).replyToMsgId || (typeof m.replyTo === 'number' ? m.replyTo : null) : null;
          
          if (m.message?.includes('#system_thumbnail')) {
            if (replyToMsgId) systemThumbnailMap.set(replyToMsgId, m as Api.Message);
            return false;
          }

          const { type } = parseMediaMeta(m as Api.Message);
          if (filterConfig.type && filterConfig.type !== 'all' && type !== filterConfig.type) return false;
          if (filterConfig.excludeType && filterConfig.excludeType.includes(type)) return false;
          
          // If we used targetIdsToFetch, we already filtered by tag, but we still need to filter untagged/trash just in case
          // Actually targetIdsToFetch already did all tag filtering!
          if (!targetIdsToFetch) {
            const fileTags = getAllTagsMap()[m.id] || [];
            const lowerTags = fileTags.map(t => t.toLowerCase());
            
            if (filterConfig.isTrash !== undefined) {
              const hasTrash = lowerTags.includes('trash');
              if (filterConfig.isTrash && !hasTrash) return false;
              if (!filterConfig.isTrash && hasTrash) return false;
            } else {
              if (lowerTags.includes('trash')) return false;
            }
            
            if (filterConfig.tag) {
              if (!lowerTags.includes(filterConfig.tag.toLowerCase())) return false;
            }

            if (filterConfig.untaggedOnly) {
              const userTags = lowerTags.filter(t => t !== 'untagged' && !t.startsWith('hash_') && !t.startsWith('vhash_'));
              if (userTags.length > 0) return false;
            }
          }

          return true;
        });
        
        finalFiles = [...finalFiles, ...files];
        
        if (targetIdsToFetch) {
           // We already updated currentFetchOffset based on the ID chunk
           if (currentFetchOffset === targetIdsToFetch[targetIdsToFetch.length - 1]) {
             newHasMore = false;
           }
        } else {
          if (!isRecentSource && msgs.length < LIMIT) {
            newHasMore = false;
          }
          if (msgs.length > 0) {
            currentFetchOffset = msgs[msgs.length - 1].id;
          } else {
            break;
          }
        }
        
        if (targetIdsToFetch) {
          lastFetchedIdLocal = currentFetchOffset;
        } else if (msgs.length > 0) {
          lastFetchedIdLocal = msgs[msgs.length - 1].id;
        } else if (isRecentSource) {
          // Ensure lastFetchedId is not null so handleLoadMore can trigger again
          // since isRecentSource relies on globalOffsetsRef, not the actual ID.
          lastFetchedIdLocal = 1; 
        }
      }
      
      setHasMore(newHasMore);
      if (isRecentSource) {
        globalOffsetsRef.current = newGlobalOffsets;
      }
      
      if (lastFetchedIdLocal !== null) {
        setLastFetchedId(lastFetchedIdLocal);
      }
      
      if (offsetId === 0) {
        setMessages(finalFiles as Api.Message[]);
      } else {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newFiles = finalFiles.filter(f => !existingIds.has(f.id));
          return [...prev, ...(newFiles as Api.Message[])];
        });
      }
    } catch (e) {
      console.error(e);
      // Do NOT setHasMore(false) here. Transient network errors should not permanently halt pagination.
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, sortOrder, filterConfig.type, filterConfig.tag, filterConfig.isTrash, filterConfig.untaggedOnly, filterConfig.search, source, getAllTagsMap]);

  useEffect(() => {
    if (isAuthenticated && client) {
      const timer = setTimeout(() => fetchMessages(0), 0);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, client, fetchMessages, dependency]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMoreRef.current && hasMore && lastFetchedId !== null) {
      fetchMessages(lastFetchedId);
    }
  }, [hasMore, lastFetchedId, fetchMessages]);

  const visibleMessages = useMemo(() => {
    const tagsMap = getAllTagsMap();
    return messages.filter(m => {
      const fileTags = tagsMap[m.id] || [];
      const lowerTags = fileTags.map(t => t.toLowerCase());
      
      if (filterConfig.isTrash !== undefined) {
        const hasTrash = lowerTags.includes('trash');
        if (filterConfig.isTrash && !hasTrash) return false;
        if (!filterConfig.isTrash && hasTrash) return false;
      } else {
        if (lowerTags.includes('trash')) return false;
      }
      
      if (filterConfig.tag) {
        if (!lowerTags.includes(filterConfig.tag.toLowerCase())) return false;
      }

      if (filterConfig.untaggedOnly) {
        if (lowerTags.length > 0 && !lowerTags.includes('untagged')) return false;
      }

      if (filterConfig.search) {
         const queries = filterConfig.search.toLowerCase().split(' ').filter(q => q.trim().length > 0);
         const exactTagMatches = queries.filter(q => allUniqueTags.includes(q));
         if (exactTagMatches.length > 0) {
            if (!exactTagMatches.some(tag => lowerTags.includes(tag))) {
               return false;
            }
         }
      }

      return true;
    });
  }, [messages, getAllTagsMap, filterConfig.isTrash, filterConfig.tag, filterConfig.untaggedOnly, filterConfig.search, version]);

  return { messages: visibleMessages, loading, hasMore, handleLoadMore, refresh: () => fetchMessages(0) };
}
