import 'fake-indexeddb/auto'
import { vi } from 'vitest'

// Mock localStorage
const store: Record<string, string> = {}
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => { store[k] = v }),
    removeItem: vi.fn((k: string) => { delete store[k] }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
    length: 0,
    key: vi.fn(() => null),
  },
  writable: true,
  configurable: true,
})

// Set a default business ID
store['lioncore_current_business'] = '1'
