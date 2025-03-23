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
          
          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains('activeChats')) {
            const activeChatsStore = db.createObjectStore('activeChats', { keyPath: 'id' });
            activeChatsStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
          
          if (!db.objectStoreNames.contains('chatGroups')) {
            const chatGroupsStore = db.createObjectStore('chatGroups', { keyPath: '_id' });
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
    if (!item || (storeName === 'activeChats' && !item.id) || (storeName === 'chatGroups' && !item._id)) {
      return;
    }
    
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
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
            // Check if item already exists
            const exists = prevData.some(i => 
              (storeName === 'activeChats' && i.id === item.id) || 
              (storeName === 'chatGroups' && i._id === item._id)
            );
            
            if (exists) {
              // Update existing item
              return prevData.map(i => 
                (storeName === 'activeChats' && i.id === item.id) || 
                (storeName === 'chatGroups' && i._id === item._id) 
                  ? itemToAdd 
                  : i
              ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            } else {
              // Add new item
              return [...prevData, itemToAdd]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            }
          });
        };
        
        addRequest.onerror = (event) => {
          console.error('Error adding item to IndexedDB:', event.target.error);
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
      console.error('Error in addItem:', err);
      setError(err);
    }
  }, [storeName]);

  // Update an item in the store
  const updateItem = useCallback(async (id, updates) => {
    if (!id) return;
    
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Get the current item
        const getRequest = store.get(storeName === 'activeChats' ? id : id);
        
        getRequest.onsuccess = () => {
          const item = getRequest.result;
          if (item) {
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
                  (storeName === 'activeChats' && i.id === id) || 
                  (storeName === 'chatGroups' && i._id === id) 
                    ? updatedItem 
                    : i
                ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              );
            };
            
            updateRequest.onerror = (event) => {
              console.error('Error updating item in IndexedDB:', event.target.error);
              setError(event.target.error);
            };
          }
        };
        
        getRequest.onerror = (event) => {
          console.error('Error getting item from IndexedDB:', event.target.error);
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
      console.error('Error in updateItem:', err);
      setError(err);
    }
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
              !(storeName === 'activeChats' && i.id === id) && 
              !(storeName === 'chatGroups' && i._id === id)
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
    addItem: addActiveChat,
    updateItem: updateActiveChat,
    removeItem: removeActiveChat,
    clearStore: clearActiveChats,
    setIsLoading
  } = useIndexedDB('activeChats', []);

   // Cache chat groups
  const addChat = useCallback((chatGroups) => {
    if (!chatGroups || !Array.isArray(chatGroups)) return;
    
    // Add timestamp to each chat group if not present
    const timestamp = new Date().toISOString();
    chatGroups.forEach(group => {
      addActiveChat({
        ...group,
        timestamp: group.timestamp || timestamp
      });
    });
  }, [addActiveChat]);
  return {
    activeChats,
    isLoading,
    error,
    addActiveChat: addChat,
    updateActiveChat,
    removeActiveChat,
    clearActiveChats,
    setIsLoading
  };
}

  


