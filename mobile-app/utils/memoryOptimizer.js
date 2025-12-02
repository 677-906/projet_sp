/**
 * Utilitaires pour optimiser la mémoire et éviter que l'app se ferme
 */

// Force le garbage collector (Android uniquement)
export const forceGarbageCollection = () => {
  if (global.gc) {
    try {
      global.gc();
      console.log('🗑️ Garbage collection forcé');
    } catch (e) {
      console.log('⚠️ GC non disponible');
    }
  }
};

// Nettoyer les grandes arrays
export const clearLargeArrays = (...arrays) => {
  arrays.forEach(arr => {
    if (Array.isArray(arr)) {
      arr.length = 0;
    }
  });
};

// Limiter la taille d'un array
export const limitArraySize = (array, maxSize = 50) => {
  if (!Array.isArray(array)) return [];
  return array.slice(0, maxSize);
};

// Log de l'utilisation mémoire (développement)
export const logMemoryUsage = () => {
  if (__DEV__ && performance.memory) {
    const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
    const total = Math.round(performance.memory.totalJSHeapSize / 1048576);
    console.log(`💾 Mémoire: ${used}MB / ${total}MB`);
  }
};
