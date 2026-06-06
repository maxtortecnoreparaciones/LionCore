/**
 * Google Apps Script - LionCore User Registration Webhook
 *
 * Deploy as Web App:
 * 1. File > New > Project
 * 2. Paste this code
 * 3. Deploy > New Deployment > Web App
 * 4. Execute as: Me
 * 5. Who has access: Anyone
 * 6. Copy the URL -> paste into registration.ts REGISTRATION_WEBHOOK_URL
 */

const SPREADSHEET_ID = '119RNFQznV3FPQMtxLtA1i-mpflUyf_5Jcq44q84jV8g'
const SHEET_NAME = 'Registros'
const LICENSES_SHEET_NAME = 'Licencias'

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    
    if (data.action === 'addLicense') {
      return handleAddLicense(data)
    }

    if (!data.email || !data.name || !data.businessName) {
      return createResponse({ success: false, message: 'Faltan campos requeridos' }, 400)
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME)
    if (!sheet) {
      return createResponse({ success: false, message: 'Sheet no encontrado' }, 500)
    }

    sheet.appendRow([
      new Date().toISOString(),
      data.name,
      data.email,
      data.businessName,
      data.businessType || 'pos',
      data.deviceId || '',
      data.plan || 'free',
      'activo'
    ])

    const licenciasSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LICENSES_SHEET_NAME)
    if (licenciasSheet) {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      
      licenciasSheet.appendRow([
        data.email,
        'free',
        new Date().toISOString().split('T')[0],
        futureDate.toISOString().split('T')[0],
        'TRUE',
        data.deviceId || '',
        `Registro automático - ${data.name} - ${data.businessName}`
      ])
    }

    return createResponse({
      success: true,
      message: 'Registro exitoso. Licencia FREE activada por 1 año.',
      email: data.email,
      plan: 'free'
    })
  } catch (error) {
    return createResponse({ success: false, message: 'Error interno: ' + error.toString() }, 500)
  }
}

function doGet(e) {
  try {
    const data = JSON.parse(e.parameter.data)

    if (data.action === 'addLicense') {
      return handleAddLicense(data)
    }
    
    if (!data.email || !data.name || !data.businessName) {
      return createResponse({ success: false, message: 'Faltan campos requeridos' }, 400)
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME)
    sheet.appendRow([
      new Date().toISOString(),
      data.name,
      data.email,
      data.businessName,
      data.businessType || 'pos',
      data.deviceId || '',
      data.plan || 'free',
      'activo'
    ])

    const licenciasSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LICENSES_SHEET_NAME)
    if (licenciasSheet) {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      
      licenciasSheet.appendRow([
        data.email,
        'free',
        new Date().toISOString().split('T')[0],
        futureDate.toISOString().split('T')[0],
        'TRUE',
        data.deviceId || '',
        `Registro automático - ${data.name} - ${data.businessName}`
      ])
    }

    return createResponse({ success: true, message: 'Registro exitoso' })
  } catch (error) {
    return createResponse({ success: false, message: 'Error: ' + error.toString() }, 500)
  }
}

function handleAddLicense(data) {
  try {
    const licenciasSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LICENSES_SHEET_NAME)
    if (!licenciasSheet) {
      return createResponse({ success: false, message: 'Sheet Licencias no encontrado' }, 500)
    }
    
    licenciasSheet.appendRow([
      data.email,
      data.plan || 'pro',
      data.startDate || new Date().toISOString().split('T')[0],
      data.endDate || new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      data.isActive || 'FALSE',
      data.deviceId || '',
      data.notes || 'Solicitud activación local',
      data.negocio || '',
      data.tipo || '',
      data.solicitado || '',
    ])
    
    return createResponse({ success: true, message: 'Licencia agregada al sheet. Pendiente de validación por administrador.' })
  } catch (error) {
    return createResponse({ success: false, message: 'Error: ' + error.toString() }, 500)
  }
}

function createResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
  output.setMimeType(ContentService.MimeType.JSON)
  
  if (statusCode !== 200) {
    const response = HtmlService.createHtmlOutput()
    response.setContent(JSON.stringify(data))
    return response
  }
  
  return output
}
