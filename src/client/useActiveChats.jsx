import { useCallback } from 'react';
import { useActiveChatsDB } from './useIndexedDB';

export function useActiveChats() {
  const {
    activeChats,
    isLoading,
    error,
    addActiveChat,
    updateActiveChat,
    removeActiveChat,
    clearActiveChats,
    setIsLoading
  } = useActiveChatsDB();

  return {
    activeChats,
    setIsLoading,
    addActiveChat,
    updateActiveChat,
    removeActiveChat,
    clearActiveChats,
    error
  };
}
