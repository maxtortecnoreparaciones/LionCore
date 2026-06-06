const SPREADSHEET_ID = '119RNFQznV3FPQMtxLtA1i-mpflUyf_5Jcq44q84jV8g'
const SHEET_NAME = 'Licencias'
const OFFLINE_GRACE_PERIOD_HOURS = 72

interface LicenseData {
  email: string
  plan: 'free' | 'pro' | 'enterprise'
  startDate: string
  endDate: string
  isActive: boolean
  deviceId: string
  notes: string
}

interface LicenseState {
  email: string
  plan: 'free' | 'pro' | 'enterprise'
  isActivated: boolean
  expiresAt: string | null
  lastChecked: string | null
  lastOnlineCheck: string | null
  deviceId: string | null
}

const LICENSE_STORAGE_KEY = 'lioncore_license'
const DEVICE_ID_KEY = 'lioncore_device_id'

function generateDeviceId(): string {
  const saved = localStorage.getItem(DEVICE_ID_KEY)
  if (saved) return saved
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'LION-'
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
    if ((i + 1) % 4 === 0 && i < 11) result += '-'
  }
  
  localStorage.setItem(DEVICE_ID_KEY, result)
  return result
}

function getDeviceId(): string {
  return localStorage.getItem(DEVICE_ID_KEY) || generateDeviceId()
}

function getLicenseState(): LicenseState {
  const saved = localStorage.getItem(LICENSE_STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return getDefaultLicense()
    }
  }
  return getDefaultLicense()
}

function getDefaultLicense(): LicenseState {
  return {
    email: '',
    plan: 'free',
    isActivated: false,
    expiresAt: null,
    lastChecked: null,
    lastOnlineCheck: null,
    deviceId: getDeviceId(),
  }
}

function saveLicenseState(state: LicenseState): void {
  localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(state))
}

function parsePlan(value: string): 'free' | 'pro' | 'enterprise' {
  const plan = value.trim().toLowerCase()
  if (plan === 'pro' || plan === 'enterprise') return plan
  return 'free'
}

function getSheetUrl(): string {
  if (!SPREADSHEET_ID) return ''
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`
}

function isOfflineGracePeriodValid(): boolean {
  const state = getLicenseState()
  if (!state.lastOnlineCheck) return true
  
  const lastCheck = new Date(state.lastOnlineCheck)
  const now = new Date()
  const diffHours = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60)
  
  return diffHours < OFFLINE_GRACE_PERIOD_HOURS
}

async function fetchSheetData(): Promise<LicenseData[]> {
  const sheetUrl = getSheetUrl()
  if (!sheetUrl) {
    console.warn('Google Sheets no configurado')
    return []
  }
  
  try {
    const response = await fetch(sheetUrl)
    if (!response.ok) return []
    
    const csv = await response.text()
    const lines = csv.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    const licenses: LicenseData[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i])
      if (cells.length < 5) continue
      
      licenses.push({
        email: (cells[0] || '').trim(),
        plan: parsePlan(cells[1] || 'free'),
        startDate: cells[2] || '',
        endDate: cells[3] || '',
        isActive: (cells[4] || '').toLowerCase() === 'verdadero' || (cells[4] || '').toLowerCase() === 'true' || cells[4] === '1',
        deviceId: cells[5] || '',
        notes: cells[6] || '',
      })
    }
    
    return licenses
  } catch (error) {
    console.error('Error fetching sheet:', error)
    return []
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

async function validateLicenseFromGoogleSheet(email: string): Promise<LicenseData | null> {
  const licenses = await fetchSheetData()
  const currentDeviceId = getDeviceId()
  
  for (const lic of licenses) {
    if (lic.email.toLowerCase() === email.toLowerCase()) {
      if (lic.deviceId && lic.deviceId !== currentDeviceId) {
        return {
          ...lic,
          isActive: false,
          notes: `Device mismatch: ${lic.deviceId} vs ${currentDeviceId}`,
        }
      }
      return lic
    }
  }
  
  return null
}

async function activateLicense(email: string): Promise<{ success: boolean; message: string }> {
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Email inválido' }
  }
  
  const licenseData = await validateLicenseFromGoogleSheet(email)
  
  if (!licenseData) {
    return { success: false, message: 'Licencia no encontrada. Verifica tu email.' }
  }
  
  if (!licenseData.isActive) {
    if (licenseData.deviceId && licenseData.deviceId !== getDeviceId()) {
      return { success: false, message: 'Esta licencia está vinculada a otro dispositivo.' }
    }
    return { success: false, message: 'Licencia desactivada. Contacta soporte.' }
  }
  
  const now = new Date()
  const endDate = new Date(licenseData.endDate)
  const isExpired = licenseData.endDate && endDate < now
  
  if (isExpired) {
    return { success: false, message: 'Licencia expirada. Renueva tu plan.' }
  }
  
  const licenseState: LicenseState = {
    email: licenseData.email,
    plan: licenseData.plan,
    isActivated: true,
    expiresAt: licenseData.endDate || null,
    lastChecked: now.toISOString(),
    lastOnlineCheck: now.toISOString(),
    deviceId: getDeviceId(),
  }
  
  saveLicenseState(licenseState)
  
  return { success: true, message: `Licencia ${licenseData.plan.toUpperCase()} activada` }
}

async function refreshLicenseCheck(): Promise<{ success: boolean; message: string; data?: LicenseData | null }> {
  const state = getLicenseState()
  if (!state.isActivated || !state.email) {
    return { success: false, message: 'No hay licencia activa' }
  }
  
  const licenseData = await validateLicenseFromGoogleSheet(state.email)
  
  if (!licenseData) {
    if (isOfflineGracePeriodValid()) {
      return { success: true, message: 'Usando licencia en modo offline' }
    }
    return { success: false, message: 'Sin conexión. Período offline expirado.' }
  }
  
  if (!licenseData.isActive) {
    saveLicenseState(getDefaultLicense())
    return { success: false, message: 'Licencia desactivada remotamente' }
  }
  
  const now = new Date()
  const endDate = new Date(licenseData.endDate)
  const isExpired = licenseData.endDate && endDate < now
  
  if (isExpired) {
    saveLicenseState(getDefaultLicense())
    return { success: false, message: 'Licencia expirada' }
  }
  
  const updated: LicenseState = {
    ...state,
    plan: licenseData.plan,
    expiresAt: licenseData.endDate || null,
    lastChecked: now.toISOString(),
    lastOnlineCheck: now.toISOString(),
    deviceId: getDeviceId(),
  }
  
  saveLicenseState(updated)
  return { success: true, message: 'Licencia verificada', data: licenseData }
}

function isFeatureAllowed(feature: 'produccion' | 'compra' | 'gastos' | 'config' | 'inventory' | 'export'): boolean {
  const state = getLicenseState()
  
  if (!state.isActivated) {
    return feature === 'inventory' || feature === 'export'
  }
  
  if (state.plan === 'free') {
    return feature === 'produccion' || feature === 'inventory' || feature === 'export'
  }
  
  if (state.plan === 'pro') {
    return true
  }
  
  if (state.plan === 'enterprise') {
    return true
  }
  
  return false
}

function getUpgradeMessage(feature: string): { title: string; message: string } {
  const messages: Record<string, { title: string; message: string }> = {
    compra: {
      title: '🔒 Compra - Solo PRO',
      message: 'Registra compras de materia prima y optimiza tu negocio. Actualiza a PRO para desbloquear.',
    },
    gastos: {
      title: '🔒 Gastos - Solo PRO',
      message: 'Controla todos tus gastos y conoce tu rentabilidad real. Actualiza a PRO para desbloquear.',
    },
    config: {
      title: '🔒 Configuración - Solo PRO',
      message: 'Ajusta costos, márgenes y precios automáticamente. Actualiza a PRO para desbloquear.',
    },
    produccion: {
      title: '🔒 Producción - Solo PRO',
      message: 'Gestiona tu producción, controla rendimiento y calcula costos. Actualiza a PRO para desbloquear.',
    },
  }
  
  return messages[feature] || {
    title: '🔒 Función PRO',
    message: 'Esta función está disponible en el plan PRO. ¡Actualiza ahora!',
  }
}

function checkLicenseStatus(): { isExpired: boolean; daysLeft: number; isOffline: boolean } {
  const state = getLicenseState()
  
  if (!state.isActivated || !state.expiresAt) {
    return { isExpired: false, daysLeft: -1, isOffline: false }
  }
  
  const now = new Date()
  const expiresAt = new Date(state.expiresAt)
  const diffTime = expiresAt.getTime() - now.getTime()
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  const isOffline = !isOfflineGracePeriodValid()
  
  return {
    isExpired: daysLeft < 0,
    daysLeft,
    isOffline,
  }
}

function deactivateLicense(): void {
  saveLicenseState(getDefaultLicense())
}

async function updateLicenseSheet(email: string, plan: string, deviceId: string, notes: string, extra?: Record<string, string>): Promise<boolean> {
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbw_placeholder/exec'
  const startDate = new Date().toISOString().split('T')[0]
  const endDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const payload: Record<string, string> = {
    action: 'addLicense',
    email,
    plan,
    deviceId,
    notes,
    startDate,
    endDate,
    isActive: 'FALSE',
    ...extra,
  }
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error('HTTP ' + response.status)
    return true
  } catch {
    try {
      await fetch(`${WEBHOOK_URL}?action=addLicense&data=${encodeURIComponent(JSON.stringify(payload))}`, {
        method: 'GET', mode: 'no-cors',
      })
      return true
    } catch {
      return false
    }
  }
}

function getDeviceDisplayInfo(): { deviceId: string; plan: string; email: string; expiresAt: string | null } {
  const state = getLicenseState()
  return {
    deviceId: getDeviceId(),
    plan: state.plan,
    email: state.email,
    expiresAt: state.expiresAt,
  }
}

export {
  getLicenseState,
  saveLicenseState,
  activateLicense,
  deactivateLicense,
  isFeatureAllowed,
  checkLicenseStatus,
  validateLicenseFromGoogleSheet,
  refreshLicenseCheck,
  getUpgradeMessage,
  getDeviceId,
  generateDeviceId,
  getDeviceDisplayInfo,
  fetchSheetData,
  updateLicenseSheet,
}

export type { LicenseState, LicenseData }
