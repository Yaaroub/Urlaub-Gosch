// Share only running requests, never completed prices or availability.
export function createPriceLoader({ fetcher = (...args) => fetch(...args), concurrency = 4 } = {}) {
  const pending = new Map();
  const queue = [];
  let active = 0;
  const abortError = () => new DOMException("Abgebrochen", "AbortError");
  function pump() {
    while (active < concurrency && queue.length) {
      const job = queue.shift();
      if (!job.listeners.size) continue;
      active++;
      (async () => {
        try {
          const response = await fetcher("/api/price", {
            method: "POST", cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(job.input), signal: job.controller.signal,
          });
          const result = await response.json();
          if (!response.ok) {
            const error = new Error(result.error || "Preis konnte nicht berechnet werden.");
            error.code = result.code;
            throw error;
          }
          for (const listener of job.listeners) listener.resolve(result);
        } catch (error) {
          for (const listener of job.listeners) listener.reject(error);
        } finally {
          for (const listener of job.listeners) listener.cleanup();
          job.listeners.clear();
          if (pending.get(job.key) === job) pending.delete(job.key);
          active--;
          pump();
        }
      })();
    }
  }
  return function loadPrice(input, { signal, priority = false } = {}) {
    if (signal?.aborted) return Promise.reject(abortError());
    const normalized = { propertyId: Number(input.propertyId), arrival: input.arrival, departure: input.departure };
    const key = JSON.stringify(normalized);
    let job = pending.get(key);
    if (!job) {
      job = { key, input: normalized, controller: new AbortController(), listeners: new Set() };
      pending.set(key, job);
      if (priority) queue.unshift(job); else queue.push(job);
    } else if (priority) {
      const index = queue.indexOf(job);
      if (index > 0) { queue.splice(index, 1); queue.unshift(job); }
    }
    return new Promise((resolve, reject) => {
      const listener = { resolve, reject, cleanup: () => signal?.removeEventListener("abort", abort) };
      function abort() {
        job.listeners.delete(listener);
        listener.cleanup();
        reject(abortError());
        if (!job.listeners.size) {
          job.controller.abort();
          const index = queue.indexOf(job);
          if (index !== -1) queue.splice(index, 1);
          if (pending.get(key) === job) pending.delete(key);
        }
      }
      job.listeners.add(listener);
      signal?.addEventListener("abort", abort, { once: true });
      pump();
    });
  };
}

export const loadPrice = createPriceLoader();
