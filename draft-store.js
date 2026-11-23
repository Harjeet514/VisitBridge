const recordId = 'VB-2076';

// Apply only this tab's changes to the latest record inside a write transaction.
// Independent edits from another tab therefore remain in the saved visit.
export function mergeChanges(before, after, latest) {
  if (JSON.stringify(before) === JSON.stringify(after)) return latest ?? after;
  if (!after || typeof after !== 'object' || Array.isArray(after)) return after;
  if (!before || typeof before !== 'object' || Array.isArray(before)) return after;
  const result = { ...latest };
  for (const key of Object.keys(before)) {
    if (!Object.hasOwn(after, key)) delete result[key];
  }
  for (const key of Object.keys(after)) {
    result[key] = mergeChanges(before[key], after[key], latest?.[key]);
  }
  return result;
}

export async function openDraftStore() {
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open('visitbridge-demo', 1);
    let expired = false;
    const timeout = setTimeout(() => {
      expired = true;
      reject(new Error('Draft storage did not open.'));
    }, 6000);
    request.onupgradeneeded = () => request.result.createObjectStore('visits', { keyPath: 'id' });
    request.onsuccess = () => {
      clearTimeout(timeout);
      if (expired) request.result.close();
      else resolve(request.result);
    };
    request.onerror = () => {
      clearTimeout(timeout);
      reject(request.error);
    };
    request.onblocked = () => {
      clearTimeout(timeout);
      expired = true;
      reject(new Error('Draft storage is busy in another tab.'));
    };
  });
  database.onversionchange = () => database.close();

  return {
    read() {
      return new Promise((resolve, reject) => {
        const transaction = database.transaction('visits', 'readonly');
        const request = transaction.objectStore('visits').get(recordId);
        transaction.oncomplete = () => resolve(request.result ?? null);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error ?? new Error('Draft read interrupted.'));
      });
    },
    write(snapshot, baseline, reset = false) {
      return new Promise((resolve, reject) => {
        const transaction = database.transaction('visits', 'readwrite');
        const records = transaction.objectStore('visits');
        const request = records.get(recordId);
        let record;
        request.onsuccess = () => {
          const previous = request.result;
          record = {
            id: recordId,
            version: 2,
            state: reset ? snapshot : mergeChanges(baseline, snapshot, previous?.state),
            updatedAt: new Date().toISOString(),
          };
          records.put(record);
        };
        transaction.oncomplete = () => resolve(record);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error ?? new Error('Draft save interrupted.'));
      });
    },
  };
}
