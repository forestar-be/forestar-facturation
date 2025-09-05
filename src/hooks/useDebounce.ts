import { useState, useEffect } from "react";

/**
 * Hook pour débouncer une valeur de recherche
 * @param value - La valeur à débouncer
 * @param delay - Le délai en millisecondes (défaut: 150ms)
 * @returns La valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number = 150): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook spécialisé pour la recherche de transactions avec optimisations
 * @param searchTerm - Le terme de recherche
 * @param delay - Le délai de debounce (défaut: 150ms)
 */
export function useTransactionSearch(searchTerm: string, delay: number = 150) {
  const debouncedSearch = useDebounce(searchTerm, delay);

  return {
    debouncedSearch,
    isSearching: searchTerm !== debouncedSearch,
  };
}
