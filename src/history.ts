export type Severity = 'low' | 'moderate' | 'high'

export interface PlantReport {
  id: string
  createdAt: string
  image: string
  filename: string
  plant: { name: string; scientific_name?: string | null; category?: string | null; growth_stage?: string | null; confidence: number }
  diagnosis: { name: string; confidence: number; severity: Severity; healthy: boolean; explanation: string }
  symptoms: { observed: string[]; associated: string[] }
  care: string[]
  nutrition: string[]
  prevention: string[]
  provider: 'demo' | 'model'
  warning?: string | null
}

const DATABASE = 'plantix-history'
const STORE = 'reports'
const VERSION = 1

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local scan history.'))
  })
}

async function withStore<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const request = operation(transaction.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not update local scan history.'))
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not update local scan history.'))
  })
}

export async function getReports(): Promise<PlantReport[]> {
  const reports = await withStore<PlantReport[]>('readonly', store => store.getAll())
  return reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function saveReport(report: PlantReport): Promise<IDBValidKey> {
  return withStore<IDBValidKey>('readwrite', store => store.put(report))
}

export function deleteReport(id: string): Promise<undefined> {
  return withStore<undefined>('readwrite', store => store.delete(id))
}

export function clearReports(): Promise<undefined> {
  return withStore<undefined>('readwrite', store => store.clear())
}

export function makePreview(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, 1200 / Math.max(image.width, image.height))
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(url)
        reject(new Error('Your browser could not prepare the image for history.'))
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.78))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('The image could not be prepared for history.'))
    }
    image.src = url
  })
}
