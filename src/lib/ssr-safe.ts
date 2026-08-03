export const isBrowser = typeof window !== "undefined";

export function getStorage<T>(key: string, fallback: T): T {
    if (!isBrowser) return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

export function setStorage<T>(key: string, value: T) {
    if (!isBrowser) return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch { }
}

export function removeStorage(key: string) {
    if (!isBrowser) return;
    localStorage.removeItem(key);
}