// LionCore Test Suite - Ejecutar en consola: testLionCore()

const testResults: string[] = []

function log(result: 'OK' | 'ERROR', message: string) {
  const msg = `[${result}] ${message}`
  console.log(msg)
  testResults.push(msg)
}

async function testLionCore() {
  console.log('🧪 INICIANDO PRUEBAS LIONCORE...')
  console.log('='.repeat(50))
  
  testResults.length = 0
  
  try {
    await testProduccion()
    await testVenta()
    await testGastos()
    await testCalculosDinero()
    
    console.log('='.repeat(50))
    console.log('📊 RESULTADOS:')
    testResults.forEach(r => console.log(r))
    
    const errors = testResults.filter(r => r.includes('[ERROR]'))
    if (errors.length === 0) {
      console.log('✅ TODAS LAS PRUEBAS PASARON')
    } else {
      console.log(`❌ ${errors.length} PRUEBA(S) FALLARON`)
    }
    
  } catch (error) {
    console.error('❌ ERROR GENERAL:', error)
  }
}

async function testProduccion() {
  console.log('\n📦 TEST 1: PRODUCCIÓN')
  
  const { getStockByProduct, createTransaction, saveTransactionMeta } = await import('./services/db')
  
  // Crear transacción de producción
  const transactionId = await createTransaction('produccion', [
    {
      name: 'Mango Test',
      quantity: 20,
      price: 3000,
      subtotal: 60000,
      costUnitario: 3000
    }
  ])
  
  // Guardar metadata
  await saveTransactionMeta(transactionId, {
    peso_entrada: 30,
    peso_salida: 20,
    tiempo: 60,
    notas: 'Test producción'
  })
  
  // Verificar inventario
  const stock = await getStockByProduct()
  const mango = stock.find(s => s.name === 'Mango Test')
  
  if (mango && mango.quantity === 20 && mango.totalProduced === 20) {
    log('OK', 'Producción suma correctamente - Stock: ' + mango.quantity)
  } else {
    log('ERROR', 'Producción fallida - Stock actual: ' + (mango?.quantity || 0))
  }
}

async function testVenta() {
  console.log('\n💰 TEST 2: VENTA')
  
  const { getStockByProduct, createTransaction } = await import('./services/db')
  
  // Obtener stock actual
  const stockBefore = await getStockByProduct()
  const mangoBefore = stockBefore.find(s => s.name === 'Mango Test')
  const stockBeforeValue = mangoBefore?.quantity || 0
  
  if (stockBeforeValue === 0) {
    log('ERROR', 'No hay stock para probar venta')
    return
  }
  
  // Crear venta de 5 unidades
  await createTransaction('venta', [
    {
      name: 'Mango Test',
      quantity: 5,
      price: 5000,
      subtotal: 25000
    }
  ])
  
  // Verificar inventario
  const stockAfter = await getStockByProduct()
  const mangoAfter = stockAfter.find(s => s.name === 'Mango Test')
  const stockAfterValue = mangoAfter?.quantity || 0
  
  if (stockAfterValue === stockBeforeValue - 5) {
    log('OK', `Venta descuenta correctamente - Antes: ${stockBeforeValue}, Después: ${stockAfterValue}`)
  } else {
    log('ERROR', `Venta fallida - Esperado: ${stockBeforeValue - 5}, Actual: ${stockAfterValue}`)
  }
}

async function testGastos() {
  console.log('\n💸 TEST 4: GASTOS')
  
  const { getStockByProduct, createTransaction } = await import('./services/db')
  
  // Obtener stock antes
  const stockBefore = await getStockByProduct()
  const mangoBefore = stockBefore.find(s => s.name === 'Mango Test')
  const stockBeforeValue = mangoBefore?.quantity || 0
  
  // Crear gasto
  await createTransaction('gasto', [
    {
      name: 'Servicios',
      quantity: 1,
      price: 10000,
      subtotal: 10000
    }
  ])
  
  // Verificar que inventario no cambió
  const stockAfter = await getStockByProduct()
  const mangoAfter = stockAfter.find(s => s.name === 'Mango Test')
  const stockAfterValue = mangoAfter?.quantity || 0
  
  if (stockAfterValue === stockBeforeValue) {
    log('OK', 'Gastos no afectan inventario')
  } else {
    log('ERROR', 'Gasto afectó inventario incorrectamente')
  }
}

async function testCalculosDinero() {
  console.log('\n💵 TEST 5: CÁLCULOS DE DINERO')
  
  const { getAllTransactions } = await import('./services/db')
  
  const transactions = await getAllTransactions()
  const ventas = transactions.filter(t => t.type === 'venta')
  const producciones = transactions.filter(t => t.type === 'produccion')
  
  const totalVentas = ventas.reduce((sum, t) => sum + t.total, 0)
  const totalProducciones = producciones.reduce((sum, t) => sum + t.total, 0)
  
  console.log('  Total ventas:', totalVentas)
  console.log('  Total producciones:', totalProducciones)
  
  if (totalVentas >= 25000 && totalProducciones >= 60000) {
    log('OK', 'Cálculos de dinero correctos')
  } else {
    log('ERROR', 'Cálculos de dinero fallidos')
  }
}

// Hacer disponible globalmente
;(window as any).testLionCore = testLionCore

export default testLionCore