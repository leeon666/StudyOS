export function parseStoredJson<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function safeReadStoredJson<T>(storage: Pick<Storage, 'getItem'>, key: string, fallback: T): T {
  return parseStoredJson(storage.getItem(key), fallback)
}

export function safeWriteStoredJson(storage: Pick<Storage, 'setItem'>, key: string, value: unknown): void {
  storage.setItem(key, JSON.stringify(value))
}
