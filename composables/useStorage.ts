export const useStorage = () => {
  const getItem = (key: string): string | null => {
    if (import.meta.client) {
      return localStorage.getItem(key);
    }
    return null;
  };

  const setItem = (key: string, value: string): void => {
    if (import.meta.client) {
      localStorage.setItem(key, value);
    }
  };

  const removeItem = (key: string): void => {
    if (import.meta.client) {
      localStorage.removeItem(key);
    }
  };

  return {
    getItem,
    setItem,
    removeItem,
  };
};
