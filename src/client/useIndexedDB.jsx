import { useState, useEffect, useCallback } from 'react';

/**
 * A hook that manages data in IndexedDB.
 * This provides a more secure and robust storage solution than localStorage.
 */
export function useIndexedDB(storeName, initialValue = []) {
  const [data, setData] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const DB_NAME = 'ChatAppDB';
  const DB_VERSION = 1;

  // Initialize the database
  useEffect(() => {
    let isMounted = true;
    let db;

    const initDB = async () => {
      try {
        setIsLoading(true);
        
        // Open the database
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        // Create object stores when database is first created or version is upgraded
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          if (!db.objectStoreNames.contains('activeChats')) {
            const chatGroupsStore = db.createObjectStore('activeChats', { keyPath: '_id' });
            chatGroupsStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        
        // Handle success
        request.onsuccess = (event) => {
          db = event.target.result;
          
          // Load data from the store
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            if (isMounted) {
              setData(getAllRequest.result);
              setIsLoading(false);
            }
          };
          
          getAllRequest.onerror = (event) => {
            if (isMounted) {
              console.error('Error loading data from IndexedDB:', event.target.error);
              setError(event.target.error);
              setIsLoading(false);
            }
          };
        };
        
        // Handle errors
        request.onerror = (event) => {
          if (isMounted) {
            console.error('Error opening IndexedDB:', event.target.error);
            setError(event.target.error);
            setIsLoading(false);
          }
        };
      } catch (err) {
        if (isMounted) {
          console.error('Error in IndexedDB setup:', err);
          setError(err);
          setIsLoading(false);
        }
      }
    };
    
    initDB();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (db) {
        db.close();
      }
    };
  }, [storeName]);

  // Add an item to the store
  const addItem = useCallback(async (item) => {
    if (!item) {
      throw new Error('Item cannot be null or undefined');
    }
    
    // Check ID based on store type
    const keyPath = storeName === 'activeChats' ? '_id' : 'id';
    if (!item[keyPath]) {
      throw new Error(`Items in ${storeName} store must have a ${keyPath}`);
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        const error = event.target.error;
        console.error('Error opening IndexedDB:', error);
        setError(error);
        reject(error);
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Add timestamp if not present
        const itemToAdd = {
          ...item,
          timestamp: item.timestamp || new Date().toISOString()
        };
        
        // Add or update the item
        const addRequest = store.put(itemToAdd);
        
        addRequest.onsuccess = () => {
          // Update the state with the new data
          setData(prevData => {
            // Check if item already exists by key
            const itemKey = item[keyPath];
            const exists = prevData.some(i => i[keyPath] === itemKey);
            
            let newData;
            if (exists) {
              // Update existing item
              newData = prevData.map(i => 
                i[keyPath] === itemKey ? itemToAdd : i
              );
            } else {
              // Add new item
              newData = [...prevData, itemToAdd];
            }
            
            // Sort by timestamp (newest first)
            return newData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          });
          
          resolve(itemToAdd);
        };
        
        addRequest.onerror = (event) => {
          const error = event.target.error;
          console.error('Error adding item to IndexedDB:', error);
          setError(error);
          reject(error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      };
    });
  }, [storeName]);

  // Update an item in the store
  const updateItem = useCallback(async (id, updates) => {
    if (!id) {
      throw new Error('ID cannot be null or undefined');
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        const error = event.target.error;
        console.error('Error opening IndexedDB:', error);
        setError(error);
        reject(error);
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const keyPath = storeName === 'activeChats' ? '_id' : 'id';
        
        // Get the current item
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => {
          const item = getRequest.result;
          if (!item) {
            const error = new Error(`Item with ${keyPath}=${id} not found`);
            setError(error);
            reject(error);
            return;
          }
          
          // Update the item
          const updatedItem = {
            ...item,
            ...updates,
            timestamp: new Date().toISOString()
          };
          
          // Put the updated item back
          const updateRequest = store.put(updatedItem);
          
          updateRequest.onsuccess = () => {
            // Update the state with the new data
            setData(prevData => 
              prevData.map(i => 
                i[keyPath] === id ? updatedItem : i
              ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            );
            resolve(updatedItem);
          };
          
          updateRequest.onerror = (event) => {
            const error = event.target.error;
            console.error('Error updating item in IndexedDB:', error);
            setError(error);
            reject(error);
          };
        };
        
        getRequest.onerror = (event) => {
          const error = event.target.error;
          console.error('Error getting item from IndexedDB:', error);
          setError(error);
          reject(error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      };
    });
  }, [storeName]);

  // Remove an item from the store
  const removeItem = useCallback(async (id) => {
    if (!id) return;
    
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Delete the item
        const deleteRequest = store.delete(storeName === 'activeChats' ? id : id);
        
        deleteRequest.onsuccess = () => {
          // Update the state by removing the item
          setData(prevData => 
            prevData.filter(i => 
              !(storeName === 'activeChats' && i._id === id)
            )
          );
        };
        
        deleteRequest.onerror = (event) => {
          console.error('Error removing item from IndexedDB:', event.target.error);
          setError(event.target.error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      };
      
      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event.target.error);
        setError(event.target.error);
      };
    } catch (err) {
      console.error('Error in removeItem:', err);
      setError(err);
    }
  }, [storeName]);

  // Clear all items from the store
  const clearStore = useCallback(async () => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Clear the store
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = () => {
          // Update the state by clearing all items
          setData([]);
        };
        
        clearRequest.onerror = (event) => {
          console.error('Error clearing store in IndexedDB:', event.target.error);
          setError(event.target.error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      };
      
      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event.target.error);
        setError(event.target.error);
      };
    } catch (err) {
      console.error('Error in clearStore:', err);
      setError(err);
    }
  }, [storeName]);

  return {
    data,
    isLoading,
    error,
    addItem,
    updateItem,
    removeItem,
    clearStore,
    setIsLoading
  };
}

/**
 * A hook specifically for managing active chats in IndexedDB.
 */
export function useActiveChatsDB() {
  const {
    data: activeChats,
    isLoading,
    error,
    addItem: addChatToStore,
    updateItem: updateChatInStore,
    removeItem: removeChatFromStore,
    clearStore: clearActiveChats,
    setIsLoading
  } = useIndexedDB('activeChats', []);

  // Add a chat group to the store - handles both single objects and arrays
  const addActiveChat = useCallback((chatData) => {
    if (!chatData) return Promise.reject(new Error('No chat data provided'));
    
    // Handle both single objects and arrays
    const isArray = Array.isArray(chatData);
    const dataToAdd = isArray ? chatData : [chatData];
    
    // Process each chat item
    const timestamp = new Date().toISOString();
    
    // Use Promise.all to handle multiple items
    return Promise.all(
      dataToAdd.map(item => {
        // Make sure each item has an _id
        if (!item._id) {
          console.error('Chat data missing _id', item);
          return Promise.reject(new Error('Chat data missing _id'));
        }
        
        return addChatToStore({
          ...item,
          timestamp: item.timestamp || timestamp
        });
      })
    );
  }, [addChatToStore]);

  // Update a chat group in the store
  const updateActiveChat = useCallback((chatData) => {
    if (!chatData || !chatData._id) {
      return Promise.reject(new Error('Invalid chat data or missing _id'));
    }
    
    // For updates, we pass the id separately from the updates
    return updateChatInStore(chatData._id, chatData);
  }, [updateChatInStore]);
  
  // Remove a chat group from the store
  const removeActiveChat = useCallback((chatId) => {
    if (!chatId) {
      return Promise.reject(new Error('Missing chat ID'));
    }
    
    return removeChatFromStore(chatId);
  }, [removeChatFromStore]);

  // Find a chat group by ID
  const findActiveChatById = useCallback((chatId) => {
    if (!chatId) return null;
    return activeChats.find(chat => chat._id === chatId) || null;
  }, [activeChats]);

  return {
    activeChats,
    isLoading,
    error,
    addActiveChat,
    updateActiveChat,
    removeActiveChat,
    clearActiveChats,
    findActiveChatById,
    setIsLoading
  };
}




