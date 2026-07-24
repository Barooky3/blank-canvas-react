const KEY = 'parfumistry-first-visit-at';

export function getFirstVisitAt(): string {
  try {
    let v = localStorage.getItem(KEY);
    if (!v) {
      v = new Date().toISOString();
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return new Date().toISOString();
  }
}

// Initialize on import so we capture as early as possible
getFirstVisitAt();
