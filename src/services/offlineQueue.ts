import { OfflineQueueItem } from '../types';

const OFFLINE_QUEUE_KEY = 'mt_offline_sync_queue_v1';

export const getOfflineQueue = (): OfflineQueueItem[] => {
  try {
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading offline queue:', e);
    return [];
  }
};

export const saveOfflineQueue = (queue: OfflineQueueItem[]): void => {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Error saving offline queue:', e);
  }
};

export const addToOfflineQueue = (
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'SYNC_ALL',
  data: any
): OfflineQueueItem => {
  const queue = getOfflineQueue();
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const newItem: OfflineQueueItem = {
    txId,
    action,
    data,
    createdAt: new Date().toISOString(),
    status: 'PENDING',
  };

  queue.push(newItem);
  saveOfflineQueue(queue);
  return newItem;
};

export const removeFromOfflineQueue = (txId: string): void => {
  const queue = getOfflineQueue();
  const filtered = queue.filter((item) => item.txId !== txId);
  saveOfflineQueue(filtered);
};

export const clearOfflineQueue = (): void => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

export const getPendingQueueCount = (): number => {
  return getOfflineQueue().filter((item) => item.status === 'PENDING' || item.status === 'FAILED').length;
};
