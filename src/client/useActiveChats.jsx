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
    findActiveChatById,
    setIsLoading
  } = useActiveChatsDB();

  // Add a utility function to help manage chat updates
  const updateChatMessages = useCallback((chatId, messages) => {
    const chat = findActiveChatById(chatId);
    if (chat) {
      return updateActiveChat({
        ...chat,
        messages,
        timestamp: new Date().toISOString()
      });
    }
    return Promise.reject(new Error(`Chat with ID ${chatId} not found`));
  }, [findActiveChatById, updateActiveChat]);

  return {
    activeChats,
    isLoading,
    error,
    addActiveChat,
    updateActiveChat,
    removeActiveChat,
    clearActiveChats,
    findActiveChatById,
    updateChatMessages,
    setIsLoading
  };
}
