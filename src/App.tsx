import { useState, useEffect } from 'react'
import { getAllTransactions, Transaction, getDailySummary, getWeeklySummary, getMonthlySummary, FinancialSummary, getTransactionMeta, db, getProductStock, getOrCreateDefaultBusiness, createTransaction, saveTransactionMeta, getStockByProduct, saveBusinessConfig, getAllBusinesses, createBusiness, deleteBusiness, updateBusinessType, Business, BusinessType, businessTemplates, getNetProfitSummary, NetProfitSummary, setCurrentBusinessId, Mesa, getMesas, openMesa, addToMesa, closeMesa, removeItemFromMesa, resetAllMesas, InventoryConfig, getInventoryConfig, saveInventoryConfig, adjustInventory, getInventoryMode, createProduction, getProductions, getProductionDashboard, Production, getRawMaterials, getFinalProducts, createServiceOrder, updateServiceOrderStatus, getServiceOrders, ServiceOrder, upsertCustomer, sendWhatsAppReceipt, getWarehouses, Warehouse, createWarehouse, deleteWarehouse, getWarehouseStock, transferStock, WarehouseStock } from './services/db'
import { getLicenseState, isFeatureAllowed, activateLicense, checkLicenseStatus, refreshLicenseCheck, getUpgradeMessage, getDeviceId, deactivateLicense, fetchSheetData } from './services/license'

type Mode = 'venta' | 'compra' | 'gasto' | 'produccion'

interface Item {
  id: number
  producto: string
  cantidad: number
  precio: number
}

interface TransactionWithMeta extends Transaction {
  meta?: Record<string, string>
}

const formatCOP = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTypeStyle = (type: string): string => {
  switch (type) {
    case 'venta':
      return 'bg-green-100 text-green-700'
    case 'compra':
      return 'bg-blue-100 text-blue-700'
    case 'gasto':
      return 'bg-red-100 text-red-700'
    case 'produccion':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const InvoicePreview = ({ mode, items, total, onClose }: { mode: Mode; items: Item[]; total: number; onClose: () => void }) => {
  const fecha = new Date().toLocaleString('es-CO')
  const numFactura = Math.floor(Math.random() * 900000) + 100000

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Factura #{numFactura}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">LIONCORE POS</h1>
            <p className="text-sm text-gray-500">{fecha}</p>
            <p className="text-sm text-gray-500 uppercase font-semibold">{mode}</p>
          </div>

          <div className="border-t border-b border-gray-300 py-4 mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-600 border-b border-gray-200">
                  <th className="text-left pb-2">Producto</th>
                  <th className="text-center pb-2">Cant.</th>
                  <th className="text-right pb-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2">{item.producto}</td>
                    <td className="py-2 text-center">x{item.cantidad}</td>
                    <td className="py-2 text-right">{formatCOP(item.cantidad * item.precio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center text-xl font-bold">
            <span>TOTAL</span>
            <span className="text-blue-600">{formatCOP(total)}</span>
          </div>

          <div className="text-center mt-8 text-sm text-gray-500">
            <p>¡Gracias por su compra!</p>
            <p>LionCore POS - Sistema de Punto de Venta</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Imprimir
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const currentBusinessId = (() => {
    const params = new URLSearchParams(window.location.search)
    return Number(params.get("business")) || 1
  })()
  
  const [currentBusinessType, setCurrentBusinessType] = useState<BusinessType>('pos')
  const currentTpl = businessTemplates[currentBusinessType] || businessTemplates.pos
  
  const [mode, setMode] = useState<Mode>('venta')
  const [producto, setProducto] = useState('')
  const [cantidad, setCantidad] = useState<number>(1)
  const [precio, setPrecio] = useState<string>('')
  const [items, setItems] = useState<Item[]>([])
  const [showInvoice, setShowInvoice] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showProductionDetails, setShowProductionDetails] = useState(false)
  const [productionMeta, setProductionMeta] = useState({
    pesoEntrada: '',
    pesoSalida: '',
    desperdicio: '',
    tiempo: '',
    notas: '',
  })
const [transactions, setTransactions] = useState<TransactionWithMeta[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [summaryPeriod, setSummaryPeriod] = useState<'diario' | 'semanal' | 'mensual'>('diario')
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [inventory, setInventory] = useState<{name: string; quantity: number; totalProduced: number; totalSold: number; lastPrice?: number; pesoEntrada?: number; pesoSalida?: number; tiempo?: number; notas?: string}[]>([])
  const [productSuggestions, setProductSuggestions] = useState<{name: string; stock: number; lastPrice?: number}[]>([])
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [inventorySearch, setInventorySearch] = useState('')
  const [businessConfig, setBusinessConfig] = useState(() => {
    const saved = localStorage.getItem(`costConfig_${currentBusinessId}`)
    return saved
      ? JSON.parse(saved)
      : {
          costoManoObra: '',
          costoEnergia: '',
          costoEmpaque: '',
          costoTransporte: '',
          porcentajeGanancia: '30',
        }
  })
  const [configSaved, setConfigSaved] = useState(false)
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [licenseEmail, setLicenseEmail] = useState('')
  const [licenseStatus, setLicenseStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState<{ title: string; message: string } | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDeviceModal, setShowDeviceModal] = useState(false)
  const [debugShow, setDebugShow] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [showNewBusinessModal, setShowNewBusinessModal] = useState(false)
  const [newBusinessName, setNewBusinessName] = useState('')
  const [newBusinessType, setNewBusinessType] = useState<BusinessType>('pos')
  const [netProfit, setNetProfit] = useState<NetProfitSummary | null>(null)
  const [loadingNetProfit, setLoadingNetProfit] = useState(false)
  const [licenseDebug, setLicenseDebug] = useState<string>('')
  const [todayWow, setTodayWow] = useState<{ ventas: number; ganancia: number } | null>(null)
  const [loadingWow, setLoadingWow] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null)
  const [showMesaProductSelect, setShowMesaProductSelect] = useState(false)
  const [mesaProductQty, setMesaProductQty] = useState(1)
  const [mesaSelectedProduct, setMesaSelectedProduct] = useState('')
  const [mesaSelectedPrice, setMesaSelectedPrice] = useState(0)
  const [invConfig, setInvConfig] = useState<InventoryConfig>(() => getInventoryConfig())
  const [showInvAdjustModal, setShowInvAdjustModal] = useState(false)
  const [adjustProduct, setAdjustProduct] = useState('')
  const [adjustQty, setAdjustQty] = useState(0)
  const [adjustReason, setAdjustReason] = useState('')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const [showProduction, setShowProduction] = useState(false)
  const [productionRawMaterial, setProductionRawMaterial] = useState('')
  const [productionRawQty, setProductionRawQty] = useState('')
  const [productionFinalProduct, setProductionFinalProduct] = useState('')
  const [productionFinalQty, setProductionFinalQty] = useState('')
  const [productionNotes, setProductionNotes] = useState('')
  const [productions, setProductions] = useState<Production[]>([])
  const [productionDashboard, setProductionDashboard] = useState<{totalProduced: number; totalWaste: number; avgRendimiento: number; totalBatches: number; totalCost: number} | null>(null)
  const [rawMaterials, setRawMaterials] = useState<any[]>([])
  const [finalProducts, setFinalProducts] = useState<any[]>([])
  const [showFruverDashboard, setShowFruverDashboard] = useState(false)
  const [fruverDashboard, setFruverDashboard] = useState<{ventasHoy: number; mermaHoy: number; gananciaHoy: number; productosCriticos: {name: string; stock: number; diasRestantes: number}[]} | null>(null)
  const [showWasteModal, setShowWasteModal] = useState(false)
  const [wasteProduct, setWasteProduct] = useState('')
  const [wasteQty, setWasteQty] = useState('')
  const [wasteReason, setWasteReason] = useState('')
  const [showServices, setShowServices] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [serviceClientName, setServiceClientName] = useState('')
  const [serviceClientPhone, setServiceClientPhone] = useState('')
  const [serviceDevice, setServiceDevice] = useState('')
  const [serviceProblem, setServiceProblem] = useState('')
  const [serviceCost, setServiceCost] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null)
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>([])
  const [showWarehouseModal, setShowWarehouseModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [newWarehouseName, setNewWarehouseName] = useState('')
  const [newWarehouseAddress, setNewWarehouseAddress] = useState('')
  const [transferFrom, setTransferFrom] = useState<number | ''>('')
  const [transferTo, setTransferTo] = useState<number | ''>('')
  const [transferProduct, setTransferProduct] = useState('')
  const [transferQty, setTransferQty] = useState('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [newProductCost, setNewProductCost] = useState('')
  const [newProductStock, setNewProductStock] = useState('')
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [editProductId, setEditProductId] = useState<number | null>(null)
  const [editProductName, setEditProductName] = useState('')
  const [editProductPrice, setEditProductPrice] = useState('')
  const [editProductCost, setEditProductCost] = useState('')
  const [editProductStock, setEditProductStock] = useState('')
  const [showQuickPurchase, setShowQuickPurchase] = useState(false)
  const [quickPurchaseProduct, setQuickPurchaseProduct] = useState('')
  const [quickPurchaseQty, setQuickPurchaseQty] = useState('')
  const [quickPurchaseCost, setQuickPurchaseCost] = useState('')
  const [showQuickAdjust, setShowQuickAdjust] = useState(false)
  const [quickAdjustProduct, setQuickAdjustProduct] = useState('')
  const [quickAdjustQty, setQuickAdjustQty] = useState('')
  const [quickAdjustType, setQuickAdjustType] = useState<'+' | '-'>('+')
  const [showPostSaleTrigger, setShowPostSaleTrigger] = useState(false)
  const [inlineEditField, setInlineEditField] = useState<{productId: number; field: 'price'|'stock'|'cost'; value: string} | null>(null)
  const [showReferrals, setShowReferrals] = useState(false)
  const [appVersion] = useState('1.0.0')
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [latestVersion, setLatestVersion] = useState('')
  const licenseState = getLicenseState()
  const licenseStatusCheck = checkLicenseStatus()
  
  useEffect(() => {
    console.log('🔍 Estado de licencia:', JSON.stringify(licenseState))
    console.log('🔍 Check status:', licenseStatusCheck)
    console.log('🔍 isActivated:', licenseState.isActivated)
    console.log('🔍 plan:', licenseState.plan)
    console.log('🔍 Modos disponibles:', getAvailableModes())
    
    fetch('https://raw.githubusercontent.com/maxtortecnoreparaciones/LionCore/main/version.json', { signal: AbortSignal.timeout(5000) })
      .then(r => r.json())
      .then(data => {
        if (data.version && data.version !== appVersion) {
          setLatestVersion(data.version)
          setUpdateAvailable(true)
        }
      })
      .catch(() => {})
    
    if (licenseState.isActivated) {
      refreshLicenseCheck().then(result => {
        if (!result.success) {
          showNotification('error', result.message)
        }
      })
    }
    if (licenseState.isActivated && licenseStatusCheck.daysLeft >= 0 && licenseStatusCheck.daysLeft <= 7) {
      showNotification('error', `Tu licencia expira en ${licenseStatusCheck.daysLeft} dias`)
    }
    if (licenseState.isActivated && licenseStatusCheck.isExpired) {
      showNotification('error', 'Tu licencia ha expirado')
    }
  }, [])

  useEffect(() => {
    if (!licenseState.isActivated) return
    const interval = setInterval(() => {
      refreshLicenseCheck().then(result => {
        if (!result.success) {
          showNotification('error', result.message)
        }
      })
    }, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [licenseState.isActivated])

  useEffect(() => {
    localStorage.setItem(`costConfig_${currentBusinessId}`, JSON.stringify(businessConfig))
  }, [businessConfig, currentBusinessId])

  useEffect(() => {
    getAllBusinesses().then(bizs => {
      setBusinesses(bizs)
      const current = bizs.find(b => b.id === currentBusinessId)
      if (current) setCurrentBusinessType(current.tipo || 'pos')
    })
    setInvConfig(getInventoryConfig())
    loadWarehouses()
  }, [currentBusinessId])

  useEffect(() => {
    if (currentBusinessType === 'restaurante') {
      getMesas().then(m => {
        if (m.length === 0) {
          resetAllMesas().then(() => getMesas().then(setMesas))
        } else {
          setMesas(m)
        }
      })
    }
  }, [currentBusinessId, currentBusinessType])

  const loadNetProfit = async () => {
    setLoadingNetProfit(true)
    try {
      const data = await getNetProfitSummary()
      setNetProfit(data)
    } catch (error) {
      console.error('Error loading net profit:', error)
    } finally {
      setLoadingNetProfit(false)
    }
  }

  const loadTodayWow = async () => {
    setLoadingWow(true)
    try {
      const data = await getNetProfitSummary()
      setTodayWow({ ventas: data.ventasTotales, ganancia: data.gananciaNeta })
    } catch (error) {
      console.error('Error loading today wow:', error)
    } finally {
      setLoadingWow(false)
    }
  }

  useEffect(() => {
    loadTodayWow()
  }, [currentBusinessId])

  const loadDemoData = async () => {
    setIsDemo(true)
    await getOrCreateDefaultBusiness()

    const demoProducts = [
      { name: 'Pollo Deshidratado', price: 35000, cost: 18000 },
      { name: 'Chuleta Deshidratada', price: 42000, cost: 22000 },
      { name: 'Carne Seca', price: 38000, cost: 20000 },
      { name: 'Mango Deshidratado', price: 25000, cost: 12000 },
      { name: 'Banano Chips', price: 15000, cost: 7000 },
    ]

    const productIds: number[] = []
    for (const p of demoProducts) {
      try {
        const id = await db.products.add({
          businessId: currentBusinessId,
          name: p.name,
          price: p.price,
          cost: p.cost,
          createdAt: new Date(),
        })
        productIds.push(id)
      } catch {}
    }

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(8, 0, 0, 0)

    const demoSales = [
      { productId: 0, qty: 3, timeOffset: 30 },
      { productId: 1, qty: 2, timeOffset: 75 },
      { productId: 3, qty: 5, timeOffset: 120 },
      { productId: 4, qty: 8, timeOffset: 180 },
      { productId: 0, qty: 2, timeOffset: 240 },
    ]

    for (const sale of demoSales) {
      const saleDate = new Date(todayStart.getTime() + sale.timeOffset * 60000)
      const product = demoProducts[sale.productId]
      const txId = await db.transactions.add({
        businessId: currentBusinessId,
        type: 'venta',
        total: product.price * sale.qty,
        date: saleDate,
      })
      await db.transaction_items.add({
        transactionId: txId,
        productId: productIds[sale.productId],
        name: product.name,
        quantity: sale.qty,
        price: product.price,
        subtotal: product.price * sale.qty,
        costUnitario: product.cost,
      })
    }

    const expenseDate = new Date(todayStart.getTime() + 60 * 60000)
    const expenseTxId = await db.transactions.add({
      businessId: currentBusinessId,
      type: 'gasto',
      total: 25000,
      date: expenseDate,
    })
    await db.transaction_items.add({
      transactionId: expenseTxId,
      name: 'Transporte',
      quantity: 1,
      price: 25000,
      subtotal: 25000,
    })

    await loadTodayWow()
    showNotification('success', '🎯 Demo cargada — 5 ventas, 1 gasto')
  }

  const resetDemoData = async () => {
    setIsDemo(false)
    const businessId = currentBusinessId
    const txs = await db.transactions.where('businessId').equals(businessId).toArray()
    for (const tx of txs) {
      await db.transaction_items.where('transactionId').equals(tx.id!).delete()
      await db.transaction_meta.where('transactionId').equals(tx.id!).delete()
      await db.transactions.delete(tx.id!)
    }
    await db.products.where('businessId').equals(businessId).delete()
    setTodayWow(null)
    await loadTodayWow()
    showNotification('success', 'Datos reseteados')
  }

  const total = items.reduce((sum, item) => sum + item.cantidad * item.precio, 0)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadTransactions = async () => {
    setLoadingHistory(true)
    try {
      const data = await getAllTransactions()
      const transactionsWithMeta = await Promise.all(
        data.map(async (tx) => {
          const meta = await getTransactionMeta(tx.id!)
          return { ...tx, meta }
        })
      )
      setTransactions(transactionsWithMeta)
    } catch (error) {
      console.error('Error cargando transacciones:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleToggleHistory = async () => {
    if (!showHistory) {
      await loadTransactions()
    }
    setShowHistory(!showHistory)
    if (showSummary) setShowSummary(false)
  }

  const loadSummary = async (period: 'diario' | 'semanal' | 'mensual') => {
    setLoadingSummary(true)
    try {
      let data: FinancialSummary
      switch (period) {
        case 'diario':
          data = await getDailySummary()
          break
        case 'semanal':
          data = await getWeeklySummary()
          break
        case 'mensual':
          data = await getMonthlySummary()
          break
      }
      setSummary(data)
    } catch (error) {
      console.error('Error cargando resumen:', error)
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleToggleSummary = async () => {
    if (!showSummary) {
      await loadSummary(summaryPeriod)
      await loadNetProfit()
    }
    setShowSummary(!showSummary)
    if (showHistory) setShowHistory(false)
  }

  const handlePeriodChange = async (period: 'diario' | 'semanal' | 'mensual') => {
    setSummaryPeriod(period)
    await loadSummary(period)
  }

  const handleAgregar = () => {
    const precioNum = Number(precio)
    if (!producto.trim() || cantidad < 1 || !precio || precioNum <= 0) {
      showNotification('error', 'Completa todos los campos')
      return
    }

    const newItem: Item = {
      id: Date.now(),
      producto: producto.trim(),
      cantidad,
      precio: precioNum,
    }

    setItems([...items, newItem])
    setProducto('')
    setCantidad(1)
    setPrecio('')
  }

  const handleEliminar = (id: number) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleEditar = (item: Item) => {
    setProducto(item.producto)
    setCantidad(item.cantidad)
    setPrecio(item.precio.toString())
    setEditingId(item.id)
  }

  const handleActualizar = () => {
    if (editingId === null) return

    const precioNum = Number(precio)
    if (!producto.trim() || cantidad < 1 || !precio || precioNum <= 0) {
      showNotification('error', 'Completa todos los campos')
      return
    }

    setItems(items.map(item =>
      item.id === editingId
        ? { ...item, producto: producto.trim(), cantidad, precio: precioNum }
        : item
    ))

    setProducto('')
    setCantidad(1)
    setPrecio('')
    setEditingId(null)
    showNotification('success', 'Producto actualizado')
  }

  const handleCancelarEdicion = () => {
    setProducto('')
    setCantidad(1)
    setPrecio('')
    setEditingId(null)
  }

  const handleGuardar = async () => {
    if (items.length === 0) {
      showNotification('error', 'Agrega productos primero')
      return
    }

    if (total <= 0) {
      showNotification('error', 'El total debe ser mayor a 0')
      return
    }

    if (mode === 'venta') {
      const invConfig = getInventoryConfig()
      const invMode = getInventoryMode(currentBusinessType)
      const blockSales = !invConfig.sellWithoutStock && !invMode.allowNegative

      if (blockSales) {
        for (const item of items) {
          const stock = await getProductStock(item.producto)
          if (stock < item.cantidad) {
            showNotification('error', `No tienes stock disponible para "${item.producto}". Stock actual: ${stock}`)
            return
          }
        }
      }
    }

    setLoading(true)

    try {
      await getOrCreateDefaultBusiness()

      const products = await db.products.where('businessId').equals(currentBusinessId).toArray()
      const productMap = new Map<string, { cost?: number }>()
      products.forEach(p => productMap.set(p.name.toLowerCase(), { cost: p.cost }))

      const transactionItems = items.map(item => {
        const isProduction = mode === 'produccion'
        const kgQuantity = isProduction && productionMeta.pesoSalida ? Number(productionMeta.pesoSalida) : item.cantidad
        const productCost = productMap.get(item.producto.toLowerCase())?.cost
        return {
          name: item.producto,
          quantity: kgQuantity,
          price: item.precio,
          subtotal: kgQuantity * item.precio,
          costUnitario: productCost || (isProduction ? item.precio / kgQuantity : undefined),
        }
      })

      const transactionId = await createTransaction(mode, transactionItems)

      if (mode === 'produccion') {
        const meta: Record<string, string | number> = {}
        if (productionMeta.pesoEntrada) meta.peso_entrada = Number(productionMeta.pesoEntrada)
        if (productionMeta.pesoSalida) meta.peso_salida = Number(productionMeta.pesoSalida)
        if (productionMeta.desperdicio) meta.desperdicio = Number(productionMeta.desperdicio)
        if (productionMeta.tiempo) meta.tiempo = Number(productionMeta.tiempo)
        if (productionMeta.notas) meta.notas = productionMeta.notas
        
        if (Object.keys(meta).length > 0) {
          await saveTransactionMeta(transactionId, meta)
        }
      }

      setItems([])
      setProductionMeta({ pesoEntrada: '', pesoSalida: '', desperdicio: '', tiempo: '', notas: '' })
      showNotification('success', 'Transaccion guardada correctamente')

      if (mode === 'venta' && !licenseState.isActivated) {
        setTimeout(() => setShowPostSaleTrigger(true), 800)
      }

      if (showHistory) {
        await loadTransactions()
      }
      if (showSummary) {
        await loadSummary(summaryPeriod)
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      showNotification('error', 'Error al guardar la transacción')
    } finally {
      setLoading(false)
    }
  }

  const handleImprimir = () => {
    if (items.length === 0) {
      showNotification('error', 'Agrega productos primero')
      return
    }
    setShowInvoice(true)
  }

  const handleAddProduct = async () => {
    if (!newProductName.trim()) {
      showNotification('error', 'Ingresa el nombre del producto')
      return
    }
    if (!newProductPrice || Number(newProductPrice) <= 0) {
      showNotification('error', 'Ingresa un precio válido')
      return
    }
    try {
      await db.products.add({
        businessId: currentBusinessId,
        name: newProductName.trim(),
        price: Number(newProductPrice),
        cost: newProductCost ? Number(newProductCost) : 0,
        stock: newProductStock ? Number(newProductStock) : 0,
        createdAt: new Date(),
      })
      setNewProductName('')
      setNewProductPrice('')
      setNewProductCost('')
      setNewProductStock('')
      setShowAddProduct(false)
      showNotification('success', 'Producto agregado correctamente')
      if (showInventory) {
        const stockData = await getStockByProduct()
        setInventory(stockData)
      }
    } catch (error) {
      console.error('Error al agregar producto:', error)
      showNotification('error', 'Error al agregar el producto')
    }
  }

  const openEditProduct = async (productName: string) => {
    const product = await db.products.where({ businessId: currentBusinessId, name: productName }).first()
    if (product) {
      setEditProductId(product.id || null)
      setEditProductName(product.name)
      setEditProductPrice(String(product.price))
      setEditProductCost(product.cost ? String(product.cost) : '')
      setEditProductStock(product.stock ? String(product.stock) : '0')
      setShowEditProduct(true)
    }
  }

  const handleUpdateProduct = async () => {
    if (!editProductName.trim() || editProductId === null) {
      showNotification('error', 'Selecciona un producto válido')
      return
    }
    if (!editProductPrice || Number(editProductPrice) <= 0) {
      showNotification('error', 'Ingresa un precio válido')
      return
    }
    try {
      await db.products.update(editProductId, {
        name: editProductName.trim(),
        price: Number(editProductPrice),
        cost: editProductCost ? Number(editProductCost) : 0,
        stock: editProductStock ? Number(editProductStock) : 0,
      })
      setShowEditProduct(false)
      setEditProductId(null)
      showNotification('success', 'Producto actualizado correctamente')
      const stockData = await getStockByProduct()
      setInventory(stockData)
    } catch (error) {
      console.error('Error al actualizar producto:', error)
      showNotification('error', 'Error al actualizar el producto')
    }
  }

  const openPurchaseModal = (productName: string) => {
    if (!isFeatureAllowed('compra')) {
      setShowUpgradeModal(getUpgradeMessage('compra'))
      return
    }
    setQuickPurchaseProduct(productName)
    setQuickPurchaseQty('')
    setQuickPurchaseCost('')
    setShowQuickPurchase(true)
  }

  const handleQuickPurchase = async () => {
    if (!quickPurchaseQty || Number(quickPurchaseQty) <= 0) {
      showNotification('error', 'Ingresa una cantidad valida')
      return
    }
    try {
      const product = await db.products.where({ businessId: currentBusinessId, name: quickPurchaseProduct }).first()
      if (!product) {
        showNotification('error', 'Producto no encontrado')
        return
      }
      const qty = Number(quickPurchaseQty)
      const cost = quickPurchaseCost ? Number(quickPurchaseCost) : product.cost || 0
      const txId = await db.transactions.add({
        businessId: currentBusinessId,
        type: 'compra',
        total: qty * cost,
        date: new Date(),
      })
      await db.transaction_items.add({
        transactionId: txId,
        productId: product.id,
        name: product.name,
        quantity: qty,
        price: cost,
        subtotal: qty * cost,
        costUnitario: cost,
      })
      const newStock = (product.stock || 0) + qty
      await db.products.update(product.id!, { stock: newStock, cost })
      setShowQuickPurchase(false)
      showNotification('success', `Compra registrada: ${qty} unidades de ${quickPurchaseProduct}`)
      const stockData = await getStockByProduct()
      setInventory(stockData)
    } catch (error) {
      console.error('Error al registrar compra:', error)
      showNotification('error', 'Error al registrar la compra')
    }
  }

  const openQuickAdjust = (productName: string) => {
    if (!isFeatureAllowed('config')) {
      setShowUpgradeModal(getUpgradeMessage('config'))
      return
    }
    setQuickAdjustProduct(productName)
    setQuickAdjustQty('')
    setQuickAdjustType('+')
    setShowQuickAdjust(true)
  }

  const handleQuickAdjust = async () => {
    if (!quickAdjustQty || Number(quickAdjustQty) <= 0) {
      showNotification('error', 'Ingresa una cantidad valida')
      return
    }
    try {
      const product = await db.products.where({ businessId: currentBusinessId, name: quickAdjustProduct }).first()
      if (!product) {
        showNotification('error', 'Producto no encontrado')
        return
      }
      const qty = quickAdjustType === '+' ? Number(quickAdjustQty) : -Number(quickAdjustQty)
      const newStock = (product.stock || 0) + qty
      await db.products.update(product.id!, { stock: newStock })
      await adjustInventory(quickAdjustProduct, qty, 'Ajuste rapido desde inventario')
      setShowQuickAdjust(false)
      showNotification('success', `Stock ajustado: ${quickAdjustType === '+' ? '+' : '-'}${quickAdjustQty}`)
      const stockData = await getStockByProduct()
      setInventory(stockData)
    } catch (error) {
      console.error('Error al ajustar stock:', error)
      showNotification('error', 'Error al ajustar el stock')
    }
  }

  const handleInlineSave = async (productId: number) => {
    if (!inlineEditField) return
    const val = Number(inlineEditField.value)
    if (isNaN(val) || val < 0) {
      showNotification('error', 'Valor invalido')
      setInlineEditField(null)
      return
    }
    try {
      if (inlineEditField.field === 'price') {
        await handleQuickPriceChange(productId, val)
      } else {
        const updates: Record<string, number> = {}
        updates[inlineEditField.field] = val
        await db.products.update(productId, updates)
        showNotification('success', 'Actualizado')
      }
      const stockData = await getStockByProduct()
      setInventory(stockData)
    } catch (error) {
      console.error('Error inline update:', error)
      showNotification('error', 'Error al actualizar')
    }
    setInlineEditField(null)
  }

  const loadProductionData = async () => {
    try {
      const prods = await getProductions()
      setProductions(prods)
      const dashboard = await getProductionDashboard()
      setProductionDashboard(dashboard)
      const raw = await getRawMaterials()
      setRawMaterials(raw)
      const final = await getFinalProducts()
      setFinalProducts(final)
    } catch (error) {
      console.error('Error loading production data:', error)
    }
  }

  const handleProduction = async () => {
    if (!productionRawMaterial || !productionRawQty || !productionFinalProduct || !productionFinalQty) {
      showNotification('error', 'Completa todos los campos')
      return
    }
    const rawQty = Number(productionRawQty)
    const finalQty = Number(productionFinalQty)
    if (rawQty <= 0 || finalQty <= 0) {
      showNotification('error', 'Cantidades deben ser mayores a 0')
      return
    }
    if (finalQty > rawQty) {
      showNotification('error', 'El producto final no puede ser mayor a la materia prima')
      return
    }
    try {
      const rawProduct = await db.products.where({ businessId: currentBusinessId, name: productionRawMaterial, type: 'materia_prima' }).first()
      const finalProduct = await db.products.where({ businessId: currentBusinessId, name: productionFinalProduct, type: 'producto_final' }).first()
      if (!rawProduct || !finalProduct) {
        showNotification('error', 'Selecciona materia prima y producto final validos')
        return
      }
      await createProduction(rawProduct.id!, rawQty, finalProduct.id!, finalQty, productionNotes || undefined)
      showNotification('success', 'Produccion registrada')
      setProductionRawMaterial('')
      setProductionRawQty('')
      setProductionFinalProduct('')
      setProductionFinalQty('')
      setProductionNotes('')
      await loadProductionData()
    } catch (error) {
      console.error('Error en produccion:', error)
      showNotification('error', 'Error al registrar produccion')
    }
  }

  const calculatedRendimiento = () => {
    const raw = Number(productionRawQty)
    const final = Number(productionFinalQty)
    if (raw > 0 && final > 0) {
      return ((final / raw) * 100).toFixed(1)
    }
    return '0'
  }

  const loadFruverDashboard = async () => {
    try {
      const { getFruverDashboard } = await import('./services/db')
      const dashboard = await getFruverDashboard()
      setFruverDashboard(dashboard)
    } catch (error) {
      console.error('Error loading fruver dashboard:', error)
    }
  }

  const handleRegisterWaste = async () => {
    if (!wasteProduct || !wasteQty || Number(wasteQty) <= 0) {
      showNotification('error', 'Completa todos los campos')
      return
    }
    try {
      const { registerFruverWaste } = await import('./services/db')
      await registerFruverWaste(wasteProduct, Number(wasteQty), wasteReason || 'Sin motivo')
      showNotification('success', 'Merma registrada')
      setWasteProduct('')
      setWasteQty('')
      setWasteReason('')
      setShowWasteModal(false)
      if (showFruverDashboard) {
        await loadFruverDashboard()
      }
    } catch (error) {
      console.error('Error registrando merma:', error)
      showNotification('error', 'Error al registrar merma')
    }
  }

  const handleQuickPriceChange = async (productId: number, newPrice: number) => {
    try {
      const { updateProductPrice } = await import('./services/db')
      await updateProductPrice(productId, newPrice)
      showNotification('success', 'Precio actualizado')
      const stockData = await getStockByProduct()
      setInventory(stockData)
    } catch (error) {
      console.error('Error updating price:', error)
      showNotification('error', 'Error al actualizar precio')
    }
  }

  const loadServiceOrders = async () => {
    try {
      const orders = await getServiceOrders()
      setServiceOrders(orders)
    } catch (error) {
      console.error('Error loading service orders:', error)
    }
  }

  const handleCreateServiceOrder = async () => {
    if (!serviceClientName || !serviceDevice || !serviceProblem) {
      showNotification('error', 'Completa cliente, equipo y problema')
      return
    }
    try {
      await createServiceOrder({
        clientName: serviceClientName,
        clientPhone: serviceClientPhone,
        device: serviceDevice,
        problem: serviceProblem,
        status: 'recibido',
        cost: serviceCost ? Number(serviceCost) : undefined,
        price: servicePrice ? Number(servicePrice) : undefined,
      })
      await upsertCustomer(serviceClientName, serviceClientPhone || undefined)
      showNotification('success', 'Orden de servicio creada')
      setServiceClientName('')
      setServiceClientPhone('')
      setServiceDevice('')
      setServiceProblem('')
      setServiceCost('')
      setServicePrice('')
      setShowServiceModal(false)
      await loadServiceOrders()
    } catch (error) {
      console.error('Error creating service order:', error)
      showNotification('error', 'Error al crear orden')
    }
  }

  const handleUpdateServiceStatus = async (id: number, status: ServiceOrder['status']) => {
    try {
      await updateServiceOrderStatus(id, status)
      showNotification('success', `Estado actualizado: ${status}`)
      await loadServiceOrders()
    } catch (error) {
      console.error('Error updating status:', error)
      showNotification('error', 'Error al actualizar estado')
    }
  }

  const handleSendWhatsApp = async () => {
    const product = items.map(i => `${i.producto} x${i.cantidad}`).join(', ')
    if (customerPhone) {
      await sendWhatsAppReceipt(customerPhone, product, total)
    } else {
      const msg = `Tu compra en LionCore:%0A${product}%0ATotal: $${total.toLocaleString('es-CO')}`
      window.open(`https://wa.me/573138777115?text=${msg}`, '_blank')
    }
  }

  const loadWarehouses = async () => {
    try {
      const wh = await getWarehouses()
      setWarehouses(wh)
      if (wh.length > 0 && !selectedWarehouse) {
        const def = wh.find(w => w.isDefault) || wh[0]
        setSelectedWarehouse(def.id!)
      }
    } catch (error) {
      console.error('Error loading warehouses:', error)
    }
  }

  const loadWarehouseStock = async (warehouseId: number) => {
    try {
      const stock = await getWarehouseStock(warehouseId)
      setWarehouseStock(stock)
    } catch (error) {
      console.error('Error loading warehouse stock:', error)
    }
  }

  const handleCreateWarehouse = async () => {
    if (!newWarehouseName) {
      showNotification('error', 'Nombre de bodega requerido')
      return
    }
    try {
      await createWarehouse(newWarehouseName, newWarehouseAddress || undefined)
      showNotification('success', 'Bodega creada')
      setNewWarehouseName('')
      setNewWarehouseAddress('')
      setShowWarehouseModal(false)
      await loadWarehouses()
    } catch (error) {
      console.error('Error creating warehouse:', error)
      showNotification('error', 'Error al crear bodega')
    }
  }

  const handleDeleteWarehouse = async (id: number) => {
    try {
      await deleteWarehouse(id)
      showNotification('success', 'Bodega eliminada')
      if (selectedWarehouse === id) setSelectedWarehouse(null)
      await loadWarehouses()
    } catch (error) {
      console.error('Error deleting warehouse:', error)
      showNotification('error', 'Error al eliminar bodega')
    }
  }

  const handleTransferStock = async () => {
    if (!transferFrom || !transferTo || !transferProduct || !transferQty) {
      showNotification('error', 'Completa todos los campos')
      return
    }
    try {
      await transferStock(Number(transferFrom), Number(transferTo), transferProduct, Number(transferQty))
      showNotification('success', 'Transferencia completada')
      setTransferFrom('')
      setTransferTo('')
      setTransferProduct('')
      setTransferQty('')
      setShowTransferModal(false)
      if (selectedWarehouse) await loadWarehouseStock(selectedWarehouse)
    } catch (error: any) {
      console.error('Error transferring stock:', error)
      showNotification('error', error.message || 'Error en transferencia')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAgregar()
    }
  }

 const getAvailableModes = (): Mode[] => {
    const tpl = businessTemplates[currentBusinessType] || businessTemplates.pos
    const bases: Mode[] = ['venta']
    if (tpl.showCompra && isFeatureAllowed('compra')) bases.push('compra')
    if (tpl.showProduccion && isFeatureAllowed('produccion')) bases.push('produccion')
    if (tpl.showGastos && isFeatureAllowed('gastos')) bases.push('gasto')
    return bases
  }
  
  const handleActivateLicense = async () => {
    const result = await activateLicense(licenseEmail)
    setLicenseStatus(result)
    if (result.success) {
      setTimeout(() => {
        setShowLicenseModal(false)
        setLicenseStatus(null)
        setLicenseEmail('')
        window.location.reload()
      }, 1500)
    }
  }
   
  return (
    <>
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 text-white font-semibold ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {notification.message}
        </div>
      )}

      {showInvoice && (
        <InvoicePreview
          mode={mode}
          items={items}
          total={total}
          onClose={() => setShowInvoice(false)}
        />
      )}

      <div className="min-h-screen bg-gray-100 py-6 px-4">
        <div className="w-full max-w-7xl mx-auto space-y-4">
          {!licenseState.isActivated && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-amber-800 text-lg">🔑 Activa tu licencia</h3>
                <p className="text-amber-700 text-sm">Ingresa tu email para acceder a todas las funciones</p>
              </div>
              <button
                onClick={() => setShowLicenseModal(true)}
                className="px-6 py-3 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 shadow-lg whitespace-nowrap"
              >
                Activar ahora
              </button>
            </div>
          )}

          {updateAvailable && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-blue-800 text-lg">🔄 Nueva version disponible: {latestVersion}</h3>
                <p className="text-blue-700 text-sm">Tu version: {appVersion}. Descarga la ultima version para tener las mejoras.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setUpdateAvailable(false)}
                  className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg font-semibold hover:bg-blue-100"
                >
                  Ahora no
                </button>
                <a
                  href="https://github.com/maxtortecnoreparaciones/LionCore/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                >
                  Descargar
                </a>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-800">LionCore POS</h1>
              {licenseState.isActivated && (
                <span
                  className={`text-xs px-2 py-1 rounded-full font-semibold cursor-pointer ${licenseState.plan === 'pro' ? 'bg-purple-100 text-purple-700' : licenseState.plan === 'enterprise' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => setShowDeviceModal(true)}
                  title="Click para ver info del dispositivo"
                >
                  {licenseState.plan.toUpperCase()} {licenseStatusCheck.daysLeft >= 0 && `(${licenseStatusCheck.daysLeft}d)`}
                </span>
              )}
              {!licenseState.isActivated && (
                <span className="text-xs px-2 py-1 rounded-full font-semibold bg-red-100 text-red-600">
                  FREE
                </span>
              )}
              <span className="text-xs px-2 py-1 rounded-full font-semibold bg-gray-100 text-gray-600" title="Tipo de negocio activo">
                {currentTpl.emoji} {currentTpl.label}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeviceModal(true)}
                className="px-3 py-2 rounded-lg font-semibold text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 max-w-48 truncate"
                title="Click para ver Device ID completo"
              >
                💻 ...{getDeviceId().slice(-8)}
              </button>
              {!licenseState.isActivated && (
                <button
                  onClick={() => setShowLicenseModal(true)}
                  className="px-4 py-2 rounded-lg font-semibold transition-colors bg-amber-500 text-white hover:bg-amber-600"
                >
                  🔑 Activar
                </button>
              )}
              <button
                onClick={() => {
                  if (!isFeatureAllowed('config')) {
                    const msg = getUpgradeMessage('config')
                    setShowUpgradeModal(msg)
                    return
                  }
                  setShowConfig(!showConfig); setShowSummary(false); setShowHistory(false); setShowInventory(false);
                }}
                className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  showConfig ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                ⚙️
              </button>
              <button
                onClick={async () => {
                  if (!showInventory) {
                    const stockData = await getStockByProduct()
                    setInventory(stockData)
                  }
                  setShowInventory(!showInventory)
                  setShowSummary(false); setShowHistory(false); setShowConfig(false);
                }}
                className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  showInventory ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
                >
                  📦
                </button>
                {currentBusinessType === 'deshidratados' && (
                  <button
                    onClick={async () => {
                      setShowProduction(!showProduction)
                      setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false)
                      if (!showProduction) {
                        await loadProductionData()
                      }
                    }}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      showProduction ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    🏭
                  </button>
                )}
                {currentBusinessType === 'fruver' && (
                  <button
                    onClick={async () => {
                      setShowFruverDashboard(!showFruverDashboard)
                      setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false); setShowProduction(false)
                      if (!showFruverDashboard) {
                        await loadFruverDashboard()
                      }
                    }}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      showFruverDashboard ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    📊
                  </button>
                )}
                <button
                  onClick={async () => {
                    setShowServices(!showServices)
                    setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false); setShowProduction(false); setShowFruverDashboard(false)
                    if (!showServices) {
                      await loadServiceOrders()
                    }
                  }}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    showServices ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  🔧
                </button>
                <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    showSummary || showHistory ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  ⋮
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => { handleToggleSummary(); setShowHistory(false); setShowInventory(false); setShowConfig(false); setShowMoreMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span>📊</span> Resumen
                    </button>
                    <button
                      onClick={() => { handleToggleHistory(); setShowSummary(false); setShowInventory(false); setShowConfig(false); setShowMoreMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span>📋</span> Historial
                    </button>
                    {(showHistory || showSummary) && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={async () => {
                            const headers = ['ID', 'Fecha', 'Tipo', 'Producto', 'Cantidad', 'Precio', 'Total']
                            const rows = []
                            for (const tx of transactions) {
                              const items = await db.transaction_items.where('transactionId').equals(tx.id!).toArray()
                              for (const item of items) {
                                rows.push([tx.id, new Date(tx.date).toLocaleDateString(), tx.type, item.name, item.quantity, item.price, item.subtotal])
                              }
                            }
                            const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
                            const blob = new Blob([csv], { type: 'text/csv' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `transacciones_${new Date().toISOString().split('T')[0]}.csv`
                            a.click()
                            URL.revokeObjectURL(url)
                            setShowMoreMenu(false)
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span>📥</span> Exportar CSV
                        </button>
                      </>
                    )}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => { setShowReferrals(true); setShowMoreMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span>🎁</span> Invitar y ganar
                    </button>
                    <button
                      onClick={() => { setShowConfig(true); setShowSummary(false); setShowHistory(false); setShowInventory(false); setShowMoreMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span>⚙️</span> Configuracion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!showConfig && !showSummary && !showHistory && !showInventory && (
            <>
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-emerald-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Hoy vendiste</p>
                    <p className="text-4xl font-black text-gray-800 mt-1">
                      {loadingWow ? '...' : formatCOP(todayWow?.ventas || 0)}
                    </p>
                  </div>
                  <div className="flex-1 text-right border-l border-gray-200 pl-6">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Hoy ganaste 🔥</p>
                    <p className={`text-4xl font-black mt-1 ${((todayWow?.ganancia || 0) >= 0) ? 'text-emerald-600' : 'text-red-600'}`}>
                      {loadingWow ? '...' : formatCOP(todayWow?.ganancia || 0)}
                    </p>
                    {todayWow && (todayWow.ventas > 0) && (
                      <p className="text-xs text-gray-400 mt-1">
                        Esto es lo que realmente te queda en el bolsillo
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2 justify-between items-center">
                  <p className="text-xs text-gray-400">
                    {!todayWow || todayWow.ventas === 0 ? 'Registra tu primera venta para ver tus números' : 'Actualizado en tiempo real'}
                  </p>
                  <div className="flex gap-2">
                    {!isDemo ? (
                      <button
                        onClick={loadDemoData}
                        className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-200"
                      >
                        🎯 Modo Demo
                      </button>
                    ) : (
                      <button
                        onClick={resetDemoData}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200"
                      >
                        🗑️ Reset Demo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {currentBusinessType === 'restaurante' && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">🍽️ Mesas</h2>
                      <p className="text-sm text-gray-500">
                        {mesas.filter(m => m.status === 'ocupada').length} ocupadas / {mesas.length} total
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">Tipo: {currentBusinessType}</span>
                      <button
                        onClick={() => { resetAllMesas().then(() => getMesas().then(setMesas)); setSelectedMesa(null); }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200"
                      >
                        🔄 Reset Mesas
                      </button>
                    </div>
                  </div>

                  {!selectedMesa ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {mesas.map(mesa => {
                        const statusColor = mesa.status === 'disponible' ? 'bg-green-100 border-green-300 text-green-700' :
                          mesa.status === 'abierta' ? 'bg-blue-100 border-blue-300 text-blue-700' :
                          mesa.status === 'ocupada' ? 'bg-orange-100 border-orange-300 text-orange-700' :
                          'bg-purple-100 border-purple-300 text-purple-700'
                        return (
                          <button
                            key={mesa.id}
                            onClick={() => {
                              if (mesa.status === 'disponible') {
                                openMesa(mesa.id!).then(() => getMesas().then(m => {
                                  setMesas(m)
                                  setSelectedMesa(m.find(x => x.id === mesa.id)!)
                                }))
                              } else {
                                getMesas().then(m => setSelectedMesa(m.find(x => x.id === mesa.id)!))
                              }
                            }}
                            className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-md ${statusColor}`}
                          >
                            <p className="font-bold text-sm">{mesa.name}</p>
                            <p className="text-xs mt-1 capitalize">{mesa.status}</p>
                            {mesa.total > 0 && (
                              <p className="text-xs font-bold mt-1">{formatCOP(mesa.total)}</p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">{selectedMesa.name}</h3>
                        <button
                          onClick={() => setSelectedMesa(null)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200"
                        >
                          ← Volver a mesas
                        </button>
                      </div>

                      {selectedMesa.orderItems.length > 0 ? (
                        <div className="space-y-2 mb-4">
                          {selectedMesa.orderItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.quantity} × {formatCOP(item.price)}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="font-bold text-sm">{formatCOP(item.subtotal)}</p>
                                <button
                                  onClick={() => {
                                    removeItemFromMesa(selectedMesa.id!, idx).then(() => getMesas().then(m => {
                                      setMesas(m)
                                      setSelectedMesa(m.find(x => x.id === selectedMesa.id)!)
                                    }))
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-400 text-sm py-4">Sin productos</p>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowMesaProductSelect(true)}
                          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                        >
                          + Agregar producto
                        </button>
                        {selectedMesa.orderItems.length > 0 && (
                          <button
                            onClick={() => {
                              closeMesa(selectedMesa.id!).then(() => {
                                getMesas().then(m => {
                                  setMesas(m)
                                  setSelectedMesa(null)
                                  loadTodayWow()
                                  showNotification('success', `Mesa cobrada: ${formatCOP(selectedMesa.total)}`)
                                })
                              })
                            }}
                            className="py-3 px-6 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                          >
                            💰 Cobrar {formatCOP(selectedMesa.total)}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showMesaProductSelect && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                    <button
                      onClick={() => { setShowMesaProductSelect(false); setMesaSelectedProduct(''); setMesaProductQty(1); }}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors font-bold text-lg"
                    >
                      ✕
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Agregar a {selectedMesa?.name}</h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
                        <input
                          type="text"
                          value={mesaSelectedProduct}
                          onChange={(e) => setMesaSelectedProduct(e.target.value)}
                          placeholder="Nombre del producto"
                          className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                          <input
                            type="number"
                            value={mesaProductQty}
                            onChange={(e) => setMesaProductQty(Number(e.target.value))}
                            min="1"
                            className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Precio</label>
                          <input
                            type="number"
                            value={mesaSelectedPrice}
                            onChange={(e) => setMesaSelectedPrice(Number(e.target.value))}
                            placeholder="0"
                            className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (mesaSelectedProduct && mesaSelectedPrice > 0 && selectedMesa) {
                            addToMesa(selectedMesa.id!, {
                              name: mesaSelectedProduct,
                              quantity: mesaProductQty,
                              price: mesaSelectedPrice,
                              subtotal: mesaProductQty * mesaSelectedPrice,
                            }).then(() => getMesas().then(m => {
                              setMesas(m)
                              setSelectedMesa(m.find(x => x.id === selectedMesa.id)!)
                              setShowMesaProductSelect(false)
                              setMesaSelectedProduct('')
                              setMesaProductQty(1)
                              setMesaSelectedPrice(0)
                            }))
                          }
                        }}
                        disabled={!mesaSelectedProduct || mesaSelectedPrice <= 0}
                        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {showConfig && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ Configuración</h2>

              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-700 mb-3">🏢 Negocios</h3>
                <div className="space-y-2 mb-3">
                  {businesses.map(b => {
                    const tpl = businessTemplates[b.tipo || 'pos']
                    const isActive = b.id === currentBusinessId
                    return (
                      <div
                        key={b.id}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className="flex items-center gap-2 cursor-pointer flex-1"
                            onClick={() => {
                              setCurrentBusinessId(b.id!)
                              window.location.reload()
                            }}
                          >
                            <span className="text-xl">{tpl.emoji}</span>
                            <div>
                              <p className="font-semibold text-sm">{b.name}</p>
                              <p className="text-xs text-gray-500">{tpl.label} • {tpl.unidad}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isActive && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Activo</span>}
                            {businesses.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar "${b.name}"?`)) {
                                    deleteBusiness(b.id!).then(() => window.location.reload())
                                  }
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 text-xs"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                        {isActive && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Cambiar tipo de negocio:</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {(Object.keys(businessTemplates) as BusinessType[]).map(tipo => {
                                const t = businessTemplates[tipo]
                                const isSelected = b.tipo === tipo
                                return (
                                  <button
                                    key={tipo}
                                    onClick={() => {
                                      updateBusinessType(b.id!, tipo).then(() => window.location.reload())
                                    }}
                                    className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                                      isSelected
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    {t.emoji} {t.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={() => {
                    setShowNewBusinessModal(true)
                    setNewBusinessName('')
                    setNewBusinessType('pos')
                  }}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm"
                >
                  + Nuevo Negocio
                </button>
              </div>

              {getInventoryMode(currentBusinessType).showInventory && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-700">📦 Inventario</h3>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">{currentTpl.label}</span>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer">
                      <div>
                        <p className="font-semibold text-sm">Permitir vender sin stock</p>
                        <p className="text-xs text-gray-500">No bloquear ventas si el inventario está en 0</p>
                      </div>
                      <div className={`w-12 h-6 rounded-full transition-all ${invConfig.sellWithoutStock ? 'bg-green-500' : 'bg-gray-300'}`}
                        onClick={() => { setInvConfig({ ...invConfig, sellWithoutStock: !invConfig.sellWithoutStock }); saveInventoryConfig({ ...invConfig, sellWithoutStock: !invConfig.sellWithoutStock }); }}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all mt-0.5 ${invConfig.sellWithoutStock ? 'ml-6' : 'ml-0.5'}`} />
                      </div>
                    </label>
                    <label className="flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer">
                      <div>
                        <p className="font-semibold text-sm">Alerta de stock bajo</p>
                        <p className="text-xs text-gray-500">Avisar cuando un producto tenga poco stock</p>
                      </div>
                      <div className={`w-12 h-6 rounded-full transition-all ${invConfig.lowStockAlert ? 'bg-green-500' : 'bg-gray-300'}`}
                        onClick={() => { setInvConfig({ ...invConfig, lowStockAlert: !invConfig.lowStockAlert }); saveInventoryConfig({ ...invConfig, lowStockAlert: !invConfig.lowStockAlert }); }}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all mt-0.5 ${invConfig.lowStockAlert ? 'ml-6' : 'ml-0.5'}`} />
                      </div>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Mínimo para alerta</label>
                        <input
                          type="number"
                          value={invConfig.lowStockThreshold}
                          onChange={(e) => { setInvConfig({ ...invConfig, lowStockThreshold: Number(e.target.value) }); saveInventoryConfig({ ...invConfig, lowStockThreshold: Number(e.target.value) }); }}
                          min="1"
                          className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Permitir negativo</label>
                        <select
                          value={invConfig.allowNegative ? 'true' : 'false'}
                          onChange={(e) => { setInvConfig({ ...invConfig, allowNegative: e.target.value === 'true' }); saveInventoryConfig({ ...invConfig, allowNegative: e.target.value === 'true' }); }}
                          className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInvAdjustModal(true)}
                      className="w-full py-2 px-4 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 text-sm"
                    >
                      ✏️ Ajustar inventario manual
                    </button>
                  </div>
                </div>
              )}
              
              <h3 className="font-bold text-gray-800 mb-3">Configuración de Costos</h3>
              <p className="text-sm text-gray-500 mb-4">Configura los costos fijos para calcular el precio de venta en producción.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Costo mano obra (por unidad)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={businessConfig.costoManoObra}
                    onChange={(e) => { setBusinessConfig({ ...businessConfig, costoManoObra: e.target.value }); setConfigSaved(false); }}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Costo energía</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={businessConfig.costoEnergia}
                    onChange={(e) => { setBusinessConfig({ ...businessConfig, costoEnergia: e.target.value }); setConfigSaved(false); }}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Costo empaque</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={businessConfig.costoEmpaque}
                    onChange={(e) => { setBusinessConfig({ ...businessConfig, costoEmpaque: e.target.value }); setConfigSaved(false); }}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Costo transporte</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={businessConfig.costoTransporte}
                    onChange={(e) => { setBusinessConfig({ ...businessConfig, costoTransporte: e.target.value }); setConfigSaved(false); }}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">% Ganancia</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={businessConfig.porcentajeGanancia}
                    onChange={(e) => { setBusinessConfig({ ...businessConfig, porcentajeGanancia: e.target.value }); setConfigSaved(false); }}
                    className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    await saveBusinessConfig({
                      costoManoObra: Number(businessConfig.costoManoObra) || 0,
                      costoEnergia: Number(businessConfig.costoEnergia) || 0,
                      costoEmpaque: Number(businessConfig.costoEmpaque) || 0,
                      costoTransporte: Number(businessConfig.costoTransporte) || 0,
                      porcentajeGanancia: Number(businessConfig.porcentajeGanancia) || 30,
                    })
                    setConfigSaved(true)
                    showNotification('success', 'Configuración guardada')
                  } catch (error) {
                    showNotification('error', 'Error al guardar')
                  }
                }}
                className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {configSaved ? '✓ Guardado' : 'Guardar Configuración'}
              </button>
            </div>
          )}

          {showSummary && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex gap-2 mb-4">
                {(['diario', 'semanal', 'mensual'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePeriodChange(p)}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold uppercase text-sm transition-all ${
                      summaryPeriod === p
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {loadingSummary ? (
                <div className="p-8 text-center text-gray-500">Cargando...</div>
              ) : summary ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-green-600 font-semibold">Entradas</p>
                      <p className="text-xl font-bold text-green-700">{formatCOP(summary.entradas)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-red-600 font-semibold">Salidas</p>
                      <p className="text-xl font-bold text-red-700">{formatCOP(summary.salidas)}</p>
                    </div>
                    <div className={`rounded-lg p-4 text-center ${summary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                      <p className={`text-sm font-semibold ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Balance</p>
                      <p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                        {formatCOP(summary.balance)}
                      </p>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500">{summary.transacciones} transacciones</p>

                  {netProfit && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h3 className="font-bold text-gray-800 mb-3">📈 Ganancia Real</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-emerald-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-emerald-600 font-semibold">Ventas</p>
                          <p className="text-lg font-bold text-emerald-700">{formatCOP(netProfit.ventasTotales)}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-orange-600 font-semibold">Costo productos</p>
                          <p className="text-lg font-bold text-orange-700">{formatCOP(netProfit.costoProductosVendidos)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-purple-600 font-semibold">Gastos + Compras</p>
                          <p className="text-lg font-bold text-purple-700">{formatCOP(netProfit.gastosOperativos + netProfit.comprasMateriaPrima)}</p>
                        </div>
                        <div className={`rounded-lg p-3 text-center ${netProfit.gananciaNeta >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                          <p className={`text-xs font-semibold ${netProfit.gananciaNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>Ganancia Neta</p>
                          <p className={`text-lg font-bold ${netProfit.gananciaNeta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCOP(netProfit.gananciaNeta)}
                          </p>
                          <p className={`text-xs font-bold mt-1 ${netProfit.margenPorcentaje >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {netProfit.margenPorcentaje.toFixed(1)}% margen
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {loadingNetProfit && (
                    <div className="text-center text-sm text-gray-400">Calculando ganancia...</div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400">Sin datos</div>
              )}
            </div>
          )}

          {showInventory && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Inventario</h2>
                    <p className="text-sm text-gray-500">{inventory.length} productos</p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      className="w-48 py-2 px-4 pl-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  </div>
                </div>
              </div>

              {inventory.filter(i => i.name.toLowerCase().includes(inventorySearch.toLowerCase())).length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400 text-lg mb-2">
                    {inventorySearch ? 'No se encontraron productos' : 'No hay productos en inventario'}
                  </p>
                  <p className="text-gray-400 text-sm">Registra producciones para ver el inventario</p>
                </div>
              ) : (
                <div className="p-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {inventory
                      .filter(i => i.name.toLowerCase().includes(inventorySearch.toLowerCase()))
                      .map((item, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3
                              className="font-bold text-gray-800 text-sm truncate flex-1 cursor-pointer"
                              title={item.name}
                              onClick={() => {
                                setProducto(item.name)
                                if (item.lastPrice) setPrecio(String(item.lastPrice))
                                setShowInventory(false)
                              }}
                            >
                              {item.name}
                            </h3>
                            <div className="flex gap-1 ml-2">
                              {invConfig.lowStockAlert && item.quantity <= invConfig.lowStockThreshold && item.quantity > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700" title="Stock bajo">⚠️</span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded-full ${item.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                {item.quantity > 0 ? '✓' : '✗'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-1 mb-3">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-500">Stock</span>
                              {inlineEditField?.productId === index && inlineEditField?.field === 'stock' ? (
                                <input
                                  type="number"
                                  value={inlineEditField.value}
                                  onChange={e => setInlineEditField({ ...inlineEditField, value: e.target.value })}
                                  onBlur={() => handleInlineSave(index)}
                                  onKeyDown={e => e.key === 'Enter' && handleInlineSave(index)}
                                  className="w-20 px-2 py-0.5 text-right text-lg font-bold border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className={`text-lg font-bold cursor-pointer hover:bg-blue-50 rounded px-1 ${item.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}
                                  onClick={() => setInlineEditField({ productId: index, field: 'stock', value: String(item.quantity) })}
                                  title="Click para editar"
                                >
                                  {item.quantity}
                                </span>
                              )}
                            </div>
                            {currentTpl.unidad === 'kg' && item.quantity > 0 && (
                              <div className="text-xs text-gray-400 text-right">{currentTpl.unidad}</div>
                            )}
                          </div>
                          
                          <div className="border-t border-gray-100 pt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Precio</span>
                              {inlineEditField?.productId === index && inlineEditField?.field === 'price' ? (
                                <input
                                  type="number"
                                  value={inlineEditField.value}
                                  onChange={e => setInlineEditField({ ...inlineEditField, value: e.target.value })}
                                  onBlur={() => handleInlineSave(index)}
                                  onKeyDown={e => e.key === 'Enter' && handleInlineSave(index)}
                                  className="w-24 px-2 py-0.5 text-right text-sm font-semibold border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="text-sm font-semibold text-blue-600 cursor-pointer hover:bg-blue-50 rounded px-1"
                                  onClick={() => setInlineEditField({ productId: index, field: 'price', value: String(item.lastPrice || 0) })}
                                  title="Click para editar"
                                >
                                  {item.lastPrice ? formatCOP(item.lastPrice) : '—'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>📦 {item.totalProduced || 0}</span>
                              <span>💰 {item.totalSold || 0}</span>
                            </div>
                          </div>

                          {item.quantity < 0 && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-center">
                              <p className="text-xs text-red-600 font-semibold">⚠️ Stock negativo</p>
                              <p className="text-xs text-red-500 mt-1">Ajusta o registra compra</p>
                            </div>
                          )}

                          <div className="flex gap-1.5 mt-2">
                            <button
                              onClick={() => openPurchaseModal(item.name)}
                              disabled={!isFeatureAllowed('compra')}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                !isFeatureAllowed('compra') ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              + Compra
                            </button>
                            <button
                              onClick={() => openQuickAdjust(item.name)}
                              disabled={!isFeatureAllowed('config')}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                !isFeatureAllowed('config') ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              }`}
                            >
                              Ajustar
                            </button>
                            <button
                              onClick={() => openEditProduct(item.name)}
                              className="flex-1 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
)}
                </div>
              )}

          {showProduction && currentBusinessType === 'deshidratados' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">🏭 Produccion</h2>
                <p className="text-sm text-gray-500">Convierte materia prima en producto final</p>
              </div>

              {productionDashboard && (
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-600 font-semibold">Producido Total</p>
                    <p className="text-lg font-bold text-green-700">{productionDashboard.totalProduced} kg</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-red-600 font-semibold">Merma Total</p>
                    <p className="text-lg font-bold text-red-700">{productionDashboard.totalWaste} kg</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-600 font-semibold">Rendimiento Prom.</p>
                    <p className="text-lg font-bold text-blue-700">{productionDashboard.avgRendimiento.toFixed(1)}%</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-purple-600 font-semibold">Lotes</p>
                    <p className="text-lg font-bold text-purple-700">{productionDashboard.totalBatches}</p>
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3">🔄 Nueva Produccion</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Materia Prima</label>
                    <select
                      value={productionRawMaterial}
                      onChange={e => setProductionRawMaterial(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {rawMaterials.map(p => (
                        <option key={p.id} value={p.name}>{p.name} (Stock: {p.stock || 0} kg)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Producto Final</label>
                    <select
                      value={productionFinalProduct}
                      onChange={e => setProductionFinalProduct(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {finalProducts.map(p => (
                        <option key={p.id} value={p.name}>{p.name} (Stock: {p.stock || 0} kg)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Materia Prima (kg)</label>
                    <input
                      type="number"
                      value={productionRawQty}
                      onChange={e => setProductionRawQty(e.target.value)}
                      placeholder="10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Producto Final Obtenido (kg)</label>
                    <input
                      type="number"
                      value={productionFinalQty}
                      onChange={e => setProductionFinalQty(e.target.value)}
                      placeholder="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                    <input
                      type="text"
                      value={productionNotes}
                      onChange={e => setProductionNotes(e.target.value)}
                      placeholder="Tiempo, temperatura, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {Number(productionRawQty) > 0 && Number(productionFinalQty) > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Rendimiento:</span>
                      <span className={`font-bold ${Number(calculatedRendimiento()) < 30 ? 'text-red-600' : 'text-green-600'}`}>
                        {calculatedRendimiento()}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Merma:</span>
                      <span className="text-red-500 font-semibold">{(Number(productionRawQty) - Number(productionFinalQty)).toFixed(1)} kg</span>
                    </div>
                    {Number(calculatedRendimiento()) < 30 && (
                      <p className="text-xs text-red-500 mt-2">⚠️ Estas perdiendo producto y no lo sabes</p>
                    )}
                  </div>
                )}

                <button
                  onClick={handleProduction}
                  disabled={!productionRawMaterial || !productionFinalProduct || !productionRawQty || !productionFinalQty}
                  className="w-full mt-4 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  🏭 Registrar Produccion
                </button>
              </div>

              {productions.length > 0 && (
                <div className="p-4 border-t border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-3">📋 Historial de Lotes</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {productions.slice(0, 20).map(prod => (
                      <div key={prod.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{prod.loteId}</p>
                            <p className="text-xs text-gray-500">
                              {prod.rawMaterialName} → {prod.finalProductName}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${prod.rendimiento >= 30 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {prod.rendimiento.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>{prod.rawMaterialQty} kg → {prod.finalProductQty} kg</span>
                          <span>Merma: {prod.wasteQty.toFixed(1)} kg</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(prod.date).toLocaleDateString()} - Costo: ${prod.costoUnitario.toFixed(0)}/kg
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {showFruverDashboard && currentBusinessType === 'fruver' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">🥬 Fruver Dashboard</h2>
                  <p className="text-sm text-gray-500">Hoy estas ganando o perdiendo</p>
                </div>
                <button
                  onClick={() => { setShowWasteModal(true) }}
                  className="py-2 px-4 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 text-sm"
                >
                  🗑️ Registrar Merma
                </button>
              </div>

              {fruverDashboard && (
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-600 font-semibold">Ventas Hoy</p>
                    <p className="text-lg font-bold text-green-700">{formatCOP(fruverDashboard.ventasHoy)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-red-600 font-semibold">Merma Hoy</p>
                    <p className="text-lg font-bold text-red-700">{fruverDashboard.mermaHoy.toFixed(1)} kg</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-600 font-semibold">Ganancia Hoy</p>
                    <p className={`text-lg font-bold ${fruverDashboard.gananciaHoy >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {formatCOP(fruverDashboard.gananciaHoy)}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-orange-600 font-semibold">Productos Criticos</p>
                    <p className="text-lg font-bold text-orange-700">{fruverDashboard.productosCriticos.length}</p>
                  </div>
                </div>
              )}

              {fruverDashboard && fruverDashboard.productosCriticos.length > 0 && (
                <div className="p-4 border-t border-gray-200">
                  <h3 className="font-bold text-red-600 mb-3">⚠️ Vende esto hoy o lo pierdes</h3>
                  <div className="space-y-2">
                    {fruverDashboard.productosCriticos.map((p, i) => (
                      <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">{p.name}</p>
                          <p className="text-xs text-gray-500">Stock: {p.stock.toFixed(1)} kg</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.diasRestantes <= 0 ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                          {p.diasRestantes <= 0 ? 'VENCIDO' : `${p.diasRestantes} dias`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {showWasteModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={() => setShowWasteModal(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">🗑️ Registrar Merma</h2>
                  <button onClick={() => setShowWasteModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                    <select
                      value={wasteProduct}
                      onChange={e => setWasteProduct(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Seleccionar...</option>
                      {inventory.map(p => (
                        <option key={p.name} value={p.name}>{p.name} (Stock: {p.quantity} kg)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad perdida (kg)</label>
                    <input
                      type="number"
                      value={wasteQty}
                      onChange={e => setWasteQty(e.target.value)}
                      placeholder="0.5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                    <input
                      type="text"
                      value={wasteReason}
                      onChange={e => setWasteReason(e.target.value)}
                      placeholder="Dano, vencimiento, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowWasteModal(false)}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleRegisterWaste}
                      className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                    >
                      Registrar Merma
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

{!showHistory && !showSummary && !showConfig && !showInventory && !showProduction && !showFruverDashboard && (
            <>
              <p className="text-center text-sm text-gray-500">Negocio ID: {currentBusinessId}</p>
              
              {!licenseState.isActivated && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-yellow-800 font-semibold">🔒 Modo FREE - Solo Ventas disponibles</p>
                  <button
                    onClick={() => {
                      localStorage.removeItem('lioncore_license')
                      window.location.reload()
                    }}
                    className="text-xs text-yellow-600 underline mt-1"
                  >
                    Resetear licencia
                  </button>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex gap-2">
                  {getAvailableModes().map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold uppercase text-sm transition-all duration-200 ${
                        mode === m
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex gap-2">
                  <div className="relative flex-2 flex-1">
                    <input
                      type="text"
                      placeholder={editingId ? 'Editando producto...' : mode === 'venta' ? 'Buscar producto...' : 'Producto'}
                      value={producto}
                      onChange={async (e) => {
                        setProducto(e.target.value)
                        if (mode === 'venta' && e.target.value.length > 1) {
                          const stockData = await getStockByProduct()
                          const filtered = stockData.filter(p => 
                            p.name.toLowerCase().includes(e.target.value.toLowerCase()) && p.quantity > 0
                          )
                          setProductSuggestions(filtered.map(p => ({ name: p.name, stock: p.quantity, lastPrice: p.lastPrice })))
                          setShowProductDropdown(filtered.length > 0)
                        } else {
                          setShowProductDropdown(false)
                        }
                      }}
                      onFocus={async () => {
                        if (mode === 'venta' && producto.length > 1) {
                          const stockData = await getStockByProduct()
                          const filtered = stockData.filter(p => 
                            p.name.toLowerCase().includes(producto.toLowerCase()) && p.quantity > 0
                          )
                          setProductSuggestions(filtered.map(p => ({ name: p.name, stock: p.quantity, lastPrice: p.lastPrice })))
                          setShowProductDropdown(filtered.length > 0)
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowProductDropdown(false), 150)}
                      onKeyPress={handleKeyPress}
                      className={`w-full py-3 px-4 border rounded-lg focus:outline-none focus:ring-2 ${
                        editingId ? 'border-amber-400 bg-amber-50' : 'border-gray-200 focus:ring-blue-500'
                      } focus:border-transparent`}
                    />
                    {showProductDropdown && productSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {productSuggestions.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setProducto(p.name)
                              if (p.lastPrice) setPrecio(String(p.lastPrice))
                              setShowProductDropdown(false)
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-800">{p.name}</span>
                              <div className="text-right">
                                <span className={`text-sm font-semibold ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                  Stock: {p.stock}
                                </span>
                                {p.lastPrice && (
                                  <span className="ml-3 text-sm text-blue-600">
                                    Anterior: {formatCOP(p.lastPrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {mode !== 'produccion' && (
                    <input
                      type="number"
                      placeholder={`Cantidad (${currentTpl.unidad})`}
                      value={cantidad}
                      onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                      min={1}
                      onKeyPress={handleKeyPress}
                      className={`w-20 py-3 px-3 text-center border rounded-lg focus:outline-none focus:ring-2 ${
                        editingId ? 'border-amber-400 bg-amber-50' : 'border-gray-200 focus:ring-blue-500'
                      } focus:border-transparent`}
                    />
                  )}
                  <input
                    type="number"
                    placeholder={mode === 'produccion' ? 'Costo materia prima' : 'Precio'}
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    onKeyPress={handleKeyPress}
                    min={0}
                    className={`w-28 py-3 px-3 text-right border rounded-lg focus:outline-none focus:ring-2 ${
                      editingId ? 'border-amber-400 bg-amber-50' : 'border-gray-200 focus:ring-blue-500'
                    } focus:border-transparent`}
                  />
                  <button
                    onClick={editingId ? handleActualizar : handleAgregar}
                    className={`py-3 px-6 font-semibold rounded-lg transition-colors duration-200 ${
                      editingId
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {editingId ? '✏️ Actualizar' : '+ Agregar'}
                  </button>
                  {editingId && (
                    <button
                      onClick={handleCancelarEdicion}
                      className="py-3 px-4 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition-colors duration-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {mode === 'produccion' && items.length > 0 && (
                <div className="bg-purple-50 rounded-xl shadow-md p-4">
                  <h3 className="text-purple-700 font-semibold mb-2">💡 Costo Calculado</h3>
                  <div className="text-sm text-purple-600 space-y-1">
                    <p>Materiales: {formatCOP(total)}</p>
                    <p className="text-xs text-purple-500">El precio de venta se calculará con los costos configurados</p>
                  </div>
                </div>
              )}

              {mode === 'produccion' && (
                <div className="bg-white rounded-xl shadow-md p-4">
                  <button
                    onClick={() => setShowProductionDetails(!showProductionDetails)}
                    className="text-blue-600 font-semibold text-sm flex items-center gap-2"
                  >
                    {showProductionDetails ? '▼ Ocultar detalles' : '+ Ver más detalles'}
                  </button>

                  {showProductionDetails && (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Peso entrada (kg)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={productionMeta.pesoEntrada}
                            onChange={(e) => setProductionMeta({ ...productionMeta, pesoEntrada: e.target.value })}
                            className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Peso salida (kg)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={productionMeta.pesoSalida}
                            onChange={(e) => setProductionMeta({ ...productionMeta, pesoSalida: e.target.value })}
                            className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Desperdicio (kg)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={productionMeta.desperdicio}
                            onChange={(e) => setProductionMeta({ ...productionMeta, desperdicio: e.target.value })}
                            className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Tiempo (min)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={productionMeta.tiempo}
                            onChange={(e) => setProductionMeta({ ...productionMeta, tiempo: e.target.value })}
                            className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Notas</label>
                          <input
                            type="text"
                            placeholder="Opcional"
                            value={productionMeta.notas || ''}
                            onChange={(e) => setProductionMeta({ ...productionMeta, notas: e.target.value })}
                            className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-sm text-gray-500 uppercase">
                      <th className="py-3 px-4">Producto</th>
                      <th className="py-3 px-2 text-center w-20">Cant.</th>
                      <th className="py-3 px-2 text-right w-28">Precio</th>
                      <th className="py-3 px-2 text-right w-32">Subtotal</th>
                      <th className="py-3 px-2 text-center w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          Sin productos agregados
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`border-t border-gray-100 ${
                            editingId === item.id ? 'bg-yellow-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="py-3 px-4 font-medium text-gray-800">{item.producto}</td>
                          <td className="py-3 px-2 text-center text-gray-600">x{item.cantidad}</td>
                          <td className="py-3 px-2 text-right text-gray-600">{formatCOP(item.precio)}</td>
                          <td className="py-3 px-2 text-right font-semibold text-gray-800">
                            {formatCOP(item.cantidad * item.precio)}
                          </td>
                          <td className="py-3 px-2 text-center flex gap-1">
                            <button
                              onClick={() => handleEditar(item)}
                              className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleEliminar(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              title="Eliminar"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-700">Total</h2>
                  <h2 className="text-3xl font-bold text-blue-600">{formatCOP(total)}</h2>
                </div>
              </div>

              {mode === 'venta' && (
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <label className="text-sm font-semibold text-blue-700 mb-2 block">📱 WhatsApp Cliente</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nombre (opcional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="flex-1 py-2 px-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="3138777115"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-32 py-2 px-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {mode === 'venta' && (
                  <button
                    onClick={async () => {
                      if (items.length === 0) return
                      await handleSendWhatsApp()
                    }}
                    disabled={items.length === 0 || loading}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg transition-colors duration-200 ${
                      items.length === 0 || loading
                        ? 'bg-green-300 text-green-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    📱 WhatsApp
                  </button>
                )}
                {mode === 'venta' && (
                  <button
                    onClick={handleImprimir}
                    disabled={items.length === 0 || loading}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg transition-colors duration-200 ${
                      items.length === 0 || loading
                        ? 'bg-purple-300 text-purple-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    Imprimir Factura
                  </button>
                )}
                <button
                  onClick={handleGuardar}
                  disabled={items.length === 0 || loading}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg transition-colors duration-200 ${
                    items.length === 0 || loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Guardando...' : 'Guardar transacción'}
                </button>
              </div>
            </>
          )}

          {showHistory && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Historial de Transacciones</h2>
                <p className="text-sm text-gray-500">{transactions.length} transacciones</p>
              </div>

              {loadingHistory ? (
                <div className="p-12 text-center text-gray-500">
                  Cargando...
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400 text-lg mb-2">No hay transacciones registradas</p>
                  <p className="text-gray-400 text-sm">Guarda una transacción para ver el historial</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTypeStyle(tx.type)}`}>
                          {tx.type.toUpperCase()}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(tx.date)}</p>
                        {tx.type === 'produccion' && tx.meta && (
                          <div className="mt-2 text-xs text-gray-400 space-y-1">
                            {tx.meta.peso_entrada && <p>Peso entrada: {tx.meta.peso_entrada}kg</p>}
                            {tx.meta.peso_salida && <p>Peso salida: {tx.meta.peso_salida}kg</p>}
                            {tx.meta.desperdicio && <p>Desperdicio: {tx.meta.desperdicio}kg</p>}
                            {tx.meta.tiempo && <p>Tiempo: {tx.meta.tiempo} min</p>}
                            {tx.meta.notas && <p>Notas: {tx.meta.notas}</p>}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-800">{formatCOP(tx.total)}</p>
                        <p className="text-xs text-gray-400">#{tx.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showLicenseModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                <button
                  onClick={() => { setShowLicenseModal(false); setLicenseStatus(null); setLicenseEmail(''); }}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors font-bold text-lg"
                >
                  ✕
                </button>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">🔑</div>
                  <h2 className="text-2xl font-bold text-gray-800">Activar Licencia</h2>
                  <p className="text-sm text-gray-500 mt-1">Ingresa tu email para validar la licencia</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={licenseEmail}
                      onChange={(e) => { setLicenseEmail(e.target.value); setLicenseStatus(null); }}
                      placeholder="tu@email.com"
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleActivateLicense()}
                    />
                  </div>
                  
                  {licenseStatus && (
                    <div className={`p-3 rounded-lg text-sm ${licenseStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {licenseStatus.message}
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowLicenseModal(false); setLicenseStatus(null); setLicenseEmail(''); }}
                      className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleActivateLicense}
                      disabled={!licenseEmail}
                      className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Activar
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Planes disponibles:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">Free</span>
                      <span className="text-gray-500">Ventas + Exportar</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                      <span className="font-medium text-purple-600">Pro</span>
                      <span className="text-purple-600">Todas las funciones</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => { setShowLicenseModal(false); setShowPaymentModal(true); }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 shadow-lg flex items-center justify-center gap-2"
                  >
                    💳 Pagar aquí
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      try {
                        const data = await fetchSheetData()
                        setLicenseDebug(JSON.stringify(data, null, 2))
                      } catch (e: any) {
                        setLicenseDebug(`Error: ${e.message}`)
                      }
                    }}
                    className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                  >
                    🔍 Ver datos del Sheet
                  </button>
                  {licenseDebug && (
                    <pre className="mt-2 p-2 bg-gray-900 text-green-400 rounded-lg text-xs overflow-auto max-h-48 font-mono whitespace-pre-wrap">
                      {licenseDebug}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {showPaymentModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-gray-800 transition-colors font-bold text-lg shadow-md"
                >
                  ✕
                </button>
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-center">
                  <h2 className="text-xl font-bold text-white">💳 Pagar para Activar</h2>
                  <p className="text-green-100 text-sm mt-1">Realiza el pago y envía el comprobante</p>
                </div>
                
                <div className="p-6">
                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-300 mb-4 flex justify-center">
                    <img src="/QR.jpeg" alt="QR de Pago" className="w-48 h-48 object-contain" />
                  </div>
                  
                  <a
                    href="https://wa.me/573138777115?text=Hola!%20Acabo%20de%20pagar%20mi%20licencia%20de%20LionCore%20POS.%20Env%C3%ADo%20comprobante%20de%20pago."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-green-500 border-2 border-green-600 rounded-xl p-4 mb-4 cursor-pointer hover:bg-green-600 hover:shadow-lg transition-all text-center"
                  >
                    <p className="text-white font-bold text-lg mb-1">
                      📸 Enviar comprobante de pago
                    </p>
                    <p className="text-green-100 text-sm">Toca aquí para abrir WhatsApp</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-white text-2xl">📱</span>
                      <span className="text-white text-xl font-bold">313 877 7115</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          )}

          {showUpgradeModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                <button
                  onClick={() => setShowUpgradeModal(null)}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors font-bold text-lg"
                >
                  ✕
                </button>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">🚀</div>
                  <h2 className="text-xl font-bold text-gray-800">{showUpgradeModal.title}</h2>
                  <p className="text-sm text-gray-500 mt-2">{showUpgradeModal.message}</p>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-purple-700 mb-2">Beneficios PRO:</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>✅ Compras de materia prima</li>
                    <li>✅ Registro de gastos</li>
                    <li>✅ Configuración de costos</li>
                    <li>✅ Control total de producción</li>
                    <li>✅ Reportes avanzados</li>
                  </ul>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUpgradeModal(null)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Ahora no
                  </button>
                  <button
                    onClick={() => {
                      setShowUpgradeModal(null)
                      setShowPaymentModal(true)
                    }}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 shadow-lg"
                  >
                    💳 Pagar aquí
                  </button>
                </div>
              </div>
            </div>
          )}

          {showReferrals && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={() => setShowReferrals(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="text-5xl mb-3">🎁</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Invita y gana</h2>
                <p className="text-gray-600 mb-4">Invita a un amigo y gana $10.000 en credito</p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-500 mb-2">Tu mensaje de invitacion:</p>
                  <p className="text-sm font-mono bg-white p-3 rounded border text-left">
                    Hola! Te recomiendo LionCore, el mejor POS para tu negocio. Registrate aqui 👇
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      const msg = encodeURIComponent('Hola! Te recomiendo LionCore, el mejor POS para tu negocio. Registrate aqui!')
                      window.open(`https://wa.me/573138777115?text=${msg}`, '_blank')
                      setShowReferrals(false)
                    }}
                    className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <span>📱</span> Enviar por WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('https://lioncore.app/ref')
                      showNotification('success', 'Link copiado!')
                    }}
                    className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    📋 Copiar link
                  </button>
                </div>

                <button
                  onClick={() => setShowReferrals(false)}
                  className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {showServices && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">🔧 Servicios Técnicos</h2>
                  <p className="text-sm text-gray-500">{serviceOrders.length} ordenes</p>
                </div>
                <button
                  onClick={() => setShowServiceModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  + Nueva Orden
                </button>
              </div>

              {serviceOrders.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-6xl mb-4">🔧</div>
                  <p>No hay ordenes de servicio</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {serviceOrders.map(order => (
                    <div key={order.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800">{order.clientName}</h3>
                          <p className="text-sm text-gray-600">{order.device}</p>
                          <p className="text-xs text-gray-500 mt-1">{order.problem}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.status === 'recibido' ? 'bg-gray-200 text-gray-700' :
                          order.status === 'en_proceso' ? 'bg-yellow-200 text-yellow-800' :
                          order.status === 'terminado' ? 'bg-green-200 text-green-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      {order.price && (
                        <p className="text-sm font-bold text-green-600 mb-2">
                          ${order.price.toLocaleString('es-CO')}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {order.status === 'recibido' && order.id && (
                          <button
                            onClick={() => handleUpdateServiceStatus(order.id!, 'en_proceso')}
                            className="text-xs bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                          >
                            En proceso
                          </button>
                        )}
                        {order.status === 'en_proceso' && order.id && (
                          <button
                            onClick={() => handleUpdateServiceStatus(order.id!, 'terminado')}
                            className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                          >
                            Terminado
                          </button>
                        )}
                        {order.status === 'terminado' && order.id && (
                          <button
                            onClick={async () => {
                              await handleUpdateServiceStatus(order.id!, 'entregado')
                              if (order.clientPhone) {
                                await sendWhatsAppReceipt(order.clientPhone, `Servicio ${order.device}`, order.price || 0)
                              }
                            }}
                            className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            Entregar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentBusinessType === 'service_store' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">📦 Bodegas</h2>
                    <p className="text-sm text-gray-500">{warehouses.length} ubicaciones</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700"
                    >
                      🔄 Transferir
                    </button>
                    <button
                      onClick={() => setShowWarehouseModal(true)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                    >
                      + Bodega
                    </button>
                  </div>
                </div>

                {warehouses.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto">
                    {warehouses.map(wh => (
                      <div key={wh.id} className="flex items-center gap-1">
                        <button
                          key={wh.id}
                          onClick={() => {
                            setSelectedWarehouse(wh.id!)
                            loadWarehouseStock(wh.id!)
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
                            selectedWarehouse === wh.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {wh.name} {wh.isDefault ? '⭐' : ''}
                        </button>
                        {!wh.isDefault && (
                          <button
                            onClick={() => handleDeleteWarehouse(wh.id!)}
                            className="text-red-500 hover:text-red-700 text-sm px-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedWarehouse && warehouseStock.length > 0 && (
                  <div className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                    {warehouseStock.map(stock => (
                      <div key={stock.id} className="py-2 flex justify-between items-center">
                        <div>
                          <span className="font-medium text-gray-800">{stock.productName}</span>
                          {stock.category && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {stock.category}
                            </span>
                          )}
                          {stock.imei && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                              IMEI: {stock.imei}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-gray-800">{stock.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {showServiceModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">🔧 Nueva Orden de Servicio</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nombre del Cliente *</label>
                      <input
                        type="text"
                        value={serviceClientName}
                        onChange={(e) => setServiceClientName(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Juan Perez"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Telefono (WhatsApp)</label>
                      <input
                        type="tel"
                        value={serviceClientPhone}
                        onChange={(e) => setServiceClientPhone(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="3138777115"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Equipo *</label>
                      <input
                        type="text"
                        value={serviceDevice}
                        onChange={(e) => setServiceDevice(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Laptop HP Pavilion"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Problema *</label>
                      <textarea
                        value={serviceProblem}
                        onChange={(e) => setServiceProblem(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="No enciende, pantalla azul..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Costo estimado</label>
                        <input
                          type="number"
                          value={serviceCost}
                          onChange={(e) => setServiceCost(e.target.value)}
                          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="50000"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Precio venta</label>
                        <input
                          type="number"
                          value={servicePrice}
                          onChange={(e) => setServicePrice(e.target.value)}
                          className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="150000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => setShowServiceModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateServiceOrder}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                  >
                    Crear Orden
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showConfig && !showSummary && !showHistory && !showInventory && !showMoreMenu && !showServices && (
            <div className="fixed bottom-6 right-6 z-50">
              {fabOpen && (
                <div className="absolute bottom-16 right-0 space-y-2">
                  <button
                    onClick={() => {
                      setMode('venta')
                      setFabOpen(false)
                      setShowInventory(false); setShowConfig(false); setShowSummary(false); setShowHistory(false);
                    }}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-green-700 transition-all whitespace-nowrap"
                  >
                    <span>💰</span> Venta
                  </button>
                  <button
                    onClick={() => {
                      setShowInventory(true)
                      getStockByProduct().then(setInventory)
                      setFabOpen(false)
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all whitespace-nowrap"
                  >
                    <span>📦</span> Inventario
                  </button>
                  <button
                    onClick={() => {
                      if (isFeatureAllowed('gastos')) {
                        setMode('gasto')
                        setFabOpen(false)
                        setShowInventory(false); setShowConfig(false); setShowSummary(false); setShowHistory(false);
                      } else {
                        setShowUpgradeModal(getUpgradeMessage('gastos'))
                        setFabOpen(false)
                      }
                    }}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-red-700 transition-all whitespace-nowrap"
                  >
                    <span>📝</span> Gasto
                  </button>
                </div>
              )}
              <button
                onClick={() => setFabOpen(!fabOpen)}
                className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white text-2xl font-bold transition-all ${
                  fabOpen ? 'bg-gray-600 rotate-45' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                +
              </button>
            </div>
          )}

          <div className="fixed bottom-2 right-2 z-50">
            <button
              onClick={() => setDebugShow(!debugShow)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/60 text-gray-400 hover:bg-gray-800/90 hover:text-white text-xs transition-all"
            >
              {debugShow ? '✕' : '🔍'}
            </button>
            {debugShow && (
              <div className="absolute bottom-10 right-0 bg-gray-800/95 backdrop-blur text-gray-300 rounded-xl p-4 text-xs font-mono shadow-2xl w-80">
                <h3 className="text-white font-bold mb-2">🔍 DEBUG - Licencia</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>activado: <span className={licenseState.isActivated ? 'text-green-400' : 'text-red-400'}>{String(licenseState.isActivated)}</span></div>
                  <div>plan: <span className="text-yellow-400">{licenseState.plan}</span></div>
                  <div>email: <span className="text-blue-400 truncate">{licenseState.email || '—'}</span></div>
                  <div>expires: <span className="text-blue-400">{licenseState.expiresAt || '—'}</span></div>
                  <div>días: <span className={licenseStatusCheck.daysLeft < 0 ? 'text-red-400' : 'text-green-400'}>{licenseStatusCheck.daysLeft}</span></div>
                  <div>expirada: <span className={licenseStatusCheck.isExpired ? 'text-red-400' : 'text-green-400'}>{String(licenseStatusCheck.isExpired)}</span></div>
                  <div>producción: <span className={isFeatureAllowed('produccion') ? 'text-green-400' : 'text-red-400'}>{isFeatureAllowed('produccion') ? '✅' : '❌'}</span></div>
                  <div>compra: <span className={isFeatureAllowed('compra') ? 'text-green-400' : 'text-red-400'}>{isFeatureAllowed('compra') ? '✅' : '❌'}</span></div>
                  <div>gastos: <span className={isFeatureAllowed('gastos') ? 'text-green-400' : 'text-red-400'}>{isFeatureAllowed('gastos') ? '✅' : '❌'}</span></div>
                  <div>config: <span className={isFeatureAllowed('config') ? 'text-green-400' : 'text-red-400'}>{isFeatureAllowed('config') ? '✅' : '❌'}</span></div>
                </div>
                <button
                  onClick={() => { localStorage.removeItem('lioncore_license'); window.location.reload(); }}
                  className="mt-3 w-full px-3 py-1.5 bg-red-600/80 text-white rounded hover:bg-red-600 font-bold text-xs"
                >
                  🗑️ Resetear Licencia
                </button>
              </div>
            )}
          </div>

          {showDeviceModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                <button
                  onClick={() => setShowDeviceModal(false)}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors font-bold text-lg"
                >
                  ✕
                </button>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">💻</div>
                  <h2 className="text-2xl font-bold text-gray-800">Info del Dispositivo</h2>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Device ID</p>
                    <p className="font-mono text-sm font-bold text-gray-800 break-all">{getDeviceId()}</p>
                  </div>
                  {licenseState.isActivated && (
                    <>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-semibold text-gray-800">{licenseState.email}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Plan</p>
                        <p className={`text-sm font-bold ${licenseState.plan === 'pro' ? 'text-purple-600' : licenseState.plan === 'enterprise' ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {licenseState.plan.toUpperCase()}
                        </p>
                      </div>
                      {licenseStatusCheck.daysLeft >= 0 && (
                        <div className={`rounded-lg p-3 ${licenseStatusCheck.daysLeft <= 7 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50'}`}>
                          <p className="text-xs text-gray-500">Días restantes</p>
                          <p className={`text-lg font-bold ${licenseStatusCheck.daysLeft <= 7 ? 'text-amber-600' : 'text-green-600'}`}>
                            {licenseStatusCheck.daysLeft} días
                          </p>
                        </div>
                      )}
                      {licenseStatusCheck.isExpired && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm font-bold text-red-600">⚠️ Licencia expirada</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowDeviceModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                  {licenseState.isActivated && (
                    <button
                      onClick={() => {
                        deactivateLicense()
                        setShowDeviceModal(false)
                        window.location.reload()
                      }}
                      className="py-3 px-4 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
                    >
                      Desactivar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {showInvAdjustModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                <button
                  onClick={() => { setShowInvAdjustModal(false); setAdjustProduct(''); setAdjustQty(0); setAdjustReason(''); }}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors font-bold text-lg"
                >
                  ✕
                </button>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">📦</div>
                  <h2 className="text-2xl font-bold text-gray-800">Ajustar Inventario</h2>
                  <p className="text-sm text-gray-500 mt-1">Ajusta tu inventario sin complicaciones</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
                    <input
                      type="text"
                      value={adjustProduct}
                      onChange={(e) => setAdjustProduct(e.target.value)}
                      placeholder="Nombre del producto"
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad (+ o -)</label>
                    <input
                      type="number"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(Number(e.target.value))}
                      placeholder="Ej: 10 o -5"
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivo</label>
                    <select
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="ajuste">Ajuste de inventario</option>
                      <option value="perdida">Pérdida / Merma</option>
                      <option value="robo">Robo</option>
                      <option value="entrada">Entrada manual</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (adjustProduct && adjustQty !== 0 && adjustReason) {
                        adjustInventory(adjustProduct, adjustQty, adjustReason)
                          .then(() => {
                            showNotification('success', `Inventario ajustado: ${adjustProduct} (${adjustQty > 0 ? '+' : ''}${adjustQty})`)
                            setShowInvAdjustModal(false)
                            setAdjustProduct('')
                            setAdjustQty(0)
                            setAdjustReason('')
                            if (showInventory) getStockByProduct().then(setInventory)
                          })
                          .catch((e) => showNotification('error', e.message))
                      }
                    }}
                    disabled={!adjustProduct || adjustQty === 0 || !adjustReason}
                    className="w-full py-3 px-4 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Guardar Ajuste
                  </button>
                </div>
              </div>
            </div>
          )}

          {showNewBusinessModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                <button
                  onClick={() => { setShowNewBusinessModal(false); setNewBusinessName(''); }}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors font-bold text-lg"
                >
                  ✕
                </button>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">🏢</div>
                  <h2 className="text-2xl font-bold text-gray-800">Nuevo Negocio</h2>
                  <p className="text-sm text-gray-500 mt-1">Crea un nuevo negocio con su plantilla</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del negocio</label>
                    <input
                      type="text"
                      value={newBusinessName}
                      onChange={(e) => setNewBusinessName(e.target.value)}
                      placeholder="Ej: Mi Restaurante"
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newBusinessName) {
                          createBusiness(newBusinessName, newBusinessType)
                            .then(id => { setCurrentBusinessId(id); window.location.reload() })
                            .catch(err => showNotification('error', err.message))
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de negocio</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(businessTemplates) as BusinessType[]).map(tipo => {
                        const tpl = businessTemplates[tipo]
                        const isSelected = newBusinessType === tipo
                        return (
                          <button
                            key={tipo}
                            onClick={() => setNewBusinessType(tipo)}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="text-2xl">{tpl.emoji}</span>
                            <p className="text-sm font-semibold mt-1">{tpl.label}</p>
                            <p className="text-xs text-gray-500">Unidad: {tpl.unidad}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  
                  <button
                    onClick={async () => {
                      if (!newBusinessName) return
                      try {
                        const newId = await createBusiness(newBusinessName, newBusinessType)
                        setCurrentBusinessId(newId)
                        window.location.reload()
                      } catch (e: any) {
                        showNotification('error', `Error: ${e.message}`)
                      }
                    }}
                    disabled={!newBusinessName}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Crear Negocio
                  </button>
                </div>
              </div>
            </div>
          )}

          {licenseStatusCheck.isExpired && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">Licencia Expirada</h2>
                <p className="text-gray-600 mb-6">Tu licencia ha expirado. Contacta soporte para renovar.</p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-500">Device ID</p>
                  <p className="font-mono text-sm font-bold">{getDeviceId()}</p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      deactivateLicense()
                      window.location.reload()
                    }}
                    className="py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Modo FREE
                  </button>
                  <button
                    onClick={() => {
                      setShowLicenseModal(true)
                    }}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700"
                  >
                    💳 Pagar para renovar
                  </button>
                  <a
                    href="https://wa.me/573138777115?text=Hola!%20Mi%20licencia%20expir%C3%B3%20y%20necesito%20renovarla.%20Device%20ID:%20{getDeviceId()}"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600"
                  >
                    📱
                  </a>
                </div>
              </div>
            </div>
          )}

          {showAddProduct && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={() => setShowAddProduct(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">📦 Agregar Producto</h2>
                  <button onClick={() => setShowAddProduct(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
                    <input
                      type="text"
                      value={newProductName}
                      onChange={e => setNewProductName(e.target.value)}
                      placeholder="Ej: Pollo Deshidratado"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={e => e.key === 'Enter' && handleAddProduct()}
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio de venta</label>
                      <input
                        type="number"
                        value={newProductPrice}
                        onChange={e => setNewProductPrice(e.target.value)}
                        placeholder="$0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyDown={e => e.key === 'Enter' && handleAddProduct()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo</label>
                      <input
                        type="number"
                        value={newProductCost}
                        onChange={e => setNewProductCost(e.target.value)}
                        placeholder="$0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyDown={e => e.key === 'Enter' && handleAddProduct()}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock inicial (opcional)</label>
                    <input
                      type="number"
                      value={newProductStock}
                      onChange={e => setNewProductStock(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={e => e.key === 'Enter' && handleAddProduct()}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowAddProduct(false)}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddProduct}
                      className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Guardar Producto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showEditProduct && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={() => setShowEditProduct(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">✏️ Editar Producto</h2>
                  <button onClick={() => setShowEditProduct(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
                    <input
                      type="text"
                      value={editProductName}
                      onChange={e => setEditProductName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={e => e.key === 'Enter' && handleUpdateProduct()}
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio de venta</label>
                      <input
                        type="number"
                        value={editProductPrice}
                        onChange={e => setEditProductPrice(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyDown={e => e.key === 'Enter' && handleUpdateProduct()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo</label>
                      <input
                        type="number"
                        value={editProductCost}
                        onChange={e => setEditProductCost(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyDown={e => e.key === 'Enter' && handleUpdateProduct()}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
                    <input
                      type="number"
                      value={editProductStock}
                      onChange={e => setEditProductStock(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={e => e.key === 'Enter' && handleUpdateProduct()}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowEditProduct(false)}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleUpdateProduct}
                      className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showQuickPurchase && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={() => setShowQuickPurchase(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">🛒 + Compra: {quickPurchaseProduct}</h2>
                  <button onClick={() => setShowQuickPurchase(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                      <input
                        type="number"
                        value={quickPurchaseQty}
                        onChange={e => setQuickPurchaseQty(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        onKeyDown={e => e.key === 'Enter' && handleQuickPurchase()}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo unitario</label>
                      <input
                        type="number"
                        value={quickPurchaseCost}
                        onChange={e => setQuickPurchaseCost(e.target.value)}
                        placeholder="$0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        onKeyDown={e => e.key === 'Enter' && handleQuickPurchase()}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowQuickPurchase(false)}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleQuickPurchase}
                      className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    >
                      Registrar Compra
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showQuickAdjust && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={() => setShowQuickAdjust(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">🔧 Ajustar: {quickAdjustProduct}</h2>
                  <button onClick={() => setShowQuickAdjust(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setQuickAdjustType('+')}
                      className={`flex-1 py-2 rounded-lg font-semibold ${quickAdjustType === '+' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      + Sumar
                    </button>
                    <button
                      onClick={() => setQuickAdjustType('-')}
                      className={`flex-1 py-2 rounded-lg font-semibold ${quickAdjustType === '-' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      - Restar
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                    <input
                      type="number"
                      value={quickAdjustQty}
                      onChange={e => setQuickAdjustQty(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      onKeyDown={e => e.key === 'Enter' && handleQuickAdjust()}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowQuickAdjust(false)}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleQuickAdjust}
                      className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
                    >
                      Ajustar Stock
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showWarehouseModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">📦 Nueva Bodega</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nombre *</label>
                      <input
                        type="text"
                        value={newWarehouseName}
                        onChange={(e) => setNewWarehouseName(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Principal, Sucursal Norte..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Dirección (opcional)</label>
                      <input
                        type="text"
                        value={newWarehouseAddress}
                        onChange={(e) => setNewWarehouseAddress(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Calle 123 #45-67"
                      />
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => setShowWarehouseModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateWarehouse}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                  >
                    Crear Bodega
                  </button>
                </div>
              </div>
            </div>
          )}

          {showTransferModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">🔄 Transferir Stock</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Desde</label>
                      <select
                        value={transferFrom}
                        onChange={(e) => setTransferFrom(Number(e.target.value) || '')}
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar bodega...</option>
                        {warehouses.map(wh => (
                          <option key={wh.id} value={wh.id}>{wh.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Hacia</label>
                      <select
                        value={transferTo}
                        onChange={(e) => setTransferTo(Number(e.target.value) || '')}
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar bodega...</option>
                        {warehouses.map(wh => (
                          <option key={wh.id} value={wh.id}>{wh.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Producto</label>
                      <input
                        type="text"
                        value={transferProduct}
                        onChange={(e) => setTransferProduct(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nombre del producto"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Cantidad</label>
                      <input
                        type="number"
                        value={transferQty}
                        onChange={(e) => setTransferQty(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleTransferStock}
                    className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700"
                  >
                    Transferir
                  </button>
                </div>
              </div>
            </div>
          )}

          {showPostSaleTrigger && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={() => setShowPostSaleTrigger(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Venta registrada</h3>
                <p className="text-gray-600 text-sm mb-4">¿Sabes cuanto ganaste realmente?</p>
                {!licenseState.isActivated ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-3">Activa PRO para ver tu ganancia neta</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowPostSaleTrigger(false); setShowLicenseModal(true) }}
                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-sm"
                      >
                        Activar PRO
                      </button>
                      <button
                        onClick={() => setShowPostSaleTrigger(false)}
                        className="py-2 px-4 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPostSaleTrigger(false)}
                    className="py-2 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Ver en Resumen
                  </button>
                )}
              </div>
            </div>
          )}

          {!showConfig && !showInventory && !showAddProduct && (
            <div className="fixed bottom-6 right-6 z-50">
              {fabOpen && (
                <div className="absolute bottom-16 right-0 space-y-3 animate-fade-in">
                  <button
                    onClick={() => { setMode('venta'); setFabOpen(false) }}
                    className="flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-full shadow-xl hover:bg-green-700 hover:scale-105 transition-all whitespace-nowrap"
                  >
                    <span className="text-xl">💰</span> Nueva Venta
                  </button>
                  <button
                    onClick={() => { setMode('gasto'); setFabOpen(false) }}
                    className="flex items-center gap-3 bg-orange-600 text-white px-5 py-3 rounded-full shadow-xl hover:bg-orange-700 hover:scale-105 transition-all whitespace-nowrap"
                  >
                    <span className="text-xl">📝</span> Registrar Gasto
                  </button>
                  <button
                    onClick={() => { setFabOpen(false); setShowAddProduct(true); }}
                    className="flex items-center gap-3 bg-blue-600 text-white px-5 py-3 rounded-full shadow-xl hover:bg-blue-700 hover:scale-105 transition-all whitespace-nowrap"
                  >
                    <span className="text-xl">📦</span> Agregar Producto
                  </button>
                </div>
              )}
              <button
                onClick={() => setFabOpen(!fabOpen)}
                className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white text-3xl font-bold transition-all duration-300 ${
                  fabOpen ? 'bg-gray-600 rotate-45' : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'
                }`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default App