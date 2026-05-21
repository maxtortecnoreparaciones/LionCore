const REGISTRATION_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbw_placeholder/exec'

interface RegistrationData {
  name: string
  email: string
  businessName: string
  businessType: string
  deviceId: string
  plan: 'free' | 'pro' | 'enterprise'
}

interface RegistrationResult {
  success: boolean
  message: string
}

function getDeviceId(): string {
  const key = 'lioncore_device_id'
  const saved = localStorage.getItem(key)
  if (saved) return saved
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'LION-'
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
    if ((i + 1) % 4 === 0 && i < 11) result += '-'
  }
  localStorage.setItem(key, result)
  return result
}

async function registerUser(data: RegistrationData): Promise<RegistrationResult> {
  try {
    const response = await fetch(REGISTRATION_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      return { success: false, message: 'Error del servidor. Intenta de nuevo.' }
    }
    const result = await response.json()
    return { success: true, message: result.message || 'Registro exitoso. Bienvenido a LionCore 🦁' }
  } catch (error) {
    console.error('Error al registrar:', error)
    try {
      const fallbackUrl = `${REGISTRATION_WEBHOOK_URL}?action=register&data=${encodeURIComponent(JSON.stringify(data))}`
      await fetch(fallbackUrl, { method: 'GET', mode: 'no-cors' })
      return { success: true, message: 'Registro exitoso (fuera de línea). Bienvenido a LionCore 🦁' }
    } catch {
      return { success: false, message: 'Error de conexión. Verifica tu internet e intenta de nuevo.' }
    }
  }
}

function buildRegistrationData(overrides: Partial<RegistrationData>): RegistrationData {
  return {
    name: overrides.name || '',
    email: overrides.email || '',
    businessName: overrides.businessName || '',
    businessType: overrides.businessType || 'pos',
    deviceId: getDeviceId(),
    plan: 'free',
    ...overrides,
  }
}

function getRegistrationWebhookUrl(): string {
  return REGISTRATION_WEBHOOK_URL
}

export { registerUser, buildRegistrationData, getDeviceId, getRegistrationWebhookUrl }
export type { RegistrationData, RegistrationResult }
