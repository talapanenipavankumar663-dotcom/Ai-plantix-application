import type { PlantReport } from './history'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

interface AnalysisResponse extends Omit<PlantReport, 'id' | 'createdAt' | 'image' | 'filename'> {
  plant: PlantReport['plant']
  diagnosis: PlantReport['diagnosis']
}

export async function analyzePlant(file: File): Promise<AnalysisResponse> {
  const body = new FormData()
  body.append('image', file)
  let response: Response
  try {
    response = await fetch(`${API_URL}/api/analyze`, { method: 'POST', body })
  } catch {
    throw new Error('Cannot reach the PLANTIX API. Start the backend at http://localhost:8000 and try again.')
  }
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = typeof payload === 'object' && payload !== null && 'detail' in payload
      ? String((payload as { detail: unknown }).detail)
      : `The analysis service returned ${response.status}.`
    throw new Error(detail)
  }
  return payload as AnalysisResponse
}

export async function getApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/health`)
    return response.ok
  } catch {
    return false
  }
}
