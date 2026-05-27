import { app, BrowserWindow, shell } from 'electron'
    return { action: 'allow' }
  })

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Error al cargar:', errorDescription, '(código:', errorCode, ')')
    if (errorDescription === 'ERR_CONNECTION_REFUSED' || errorCode === -102) {
      setTimeout(() => mainWindow.reload(), 1500)
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadURL('http://localhost:3456')
    mainWindow.webContents.openDevTools()
  }
}

app.whenReady().then(async () => {
  try {
    await startServer()
    const ip = getLocalIP()
    console.log(`🌐 LionCore disponible en la red: http://${ip}:3456`)
  } catch (err) {
    console.error('Error al iniciar servidor:', err)
  }
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
