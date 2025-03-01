// useLocalStorage.js
import { useState, useEffect } from 'react';

/**
 * A hook that synchronizes a piece of React state with localStorage.
 *
 * @param {string} key - The key to store in localStorage.
 * @param {*} initialValue - The initial value if localStorage is empty.
 * @returns {[any, Function]} A stateful value and a function to update it.
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      // If item exists, parse it; otherwise, use the initial value
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
