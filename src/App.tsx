import { useState, useEffect } from 'react'
import { getAllTransactions, Transaction, getDailySummary, getWeeklySummary, getMonthlySummary, FinancialSummary, getTransactionMeta, db, getProductStock, getOrCreateDefaultBusiness, createTransaction, saveTransactionMeta, getStockByProduct, saveBusinessConfig, getAllBusinesses, createBusiness, deleteBusiness, updateBusinessType, Business, BusinessType, businessTemplates, getNetProfitSummary, NetProfitSummary, setCurrentBusinessId, Mesa, getMesas, resetAllMesas, InventoryConfig, getInventoryConfig, saveInventoryConfig, adjustInventory, getInventoryMode, createProduction, getProductions, getProductionDashboard, Production, getRawMaterials, getFinalProducts, createServiceOrder, updateServiceOrderStatus, getServiceOrders, ServiceOrder, upsertCustomer, sendWhatsAppReceipt, getWarehouses, Warehouse, createWarehouse, deleteWarehouse, getWarehouseStock, transferStock, WarehouseStock, getProducts, Product } from './services/db'
import { getLicenseState, isFeatureAllowed, activateLicense, checkLicenseStatus, refreshLicenseCheck, getUpgradeMessage, getDeviceId, deactivateLicense, fetchSheetData, saveLicenseState } from './services/license'
import RestaurantModule from './components/restaurant/RestaurantModule'
import AppHeader from './components/layout/AppHeader'
import LicenseModal from './components/modals/LicenseModal'
import DeviceModal from './components/modals/DeviceModal'
import UpgradeModal from './components/modals/UpgradeModal'
import PaymentQrModal from './components/modals/PaymentQrModal'
import ReferralsModal from './components/modals/ReferralsModal'
import InvAdjustModal from './components/modals/InvAdjustModal'
import TransactionForm from './components/pos/TransactionForm'
import HistoryView from './components/views/HistoryView'
import SummaryView from './components/views/SummaryView'
import { ConfigView } from './components/views/ConfigView'
import InventoryView from './components/views/InventoryView'
import ProductionView from './components/views/ProductionView'
import { FruverView } from './components/views/FruverView'
import ServicesView from './components/views/ServicesView'
import WarehousesView from './components/views/WarehousesView'
import { formatCOP } from './utils/format'
import InvoicePreview from './components/modals/InvoicePreview'
import WasteModal from './components/modals/WasteModal'
import AddProductModal from './components/modals/AddProductModal'
import EditProductModal from './components/modals/EditProductModal'
import QuickPurchaseModal from './components/modals/QuickPurchaseModal'
import QuickAdjustModal from './components/modals/QuickAdjustModal'
import NewWarehouseModal from './components/modals/NewWarehouseModal'
import TransferStockModal from './components/modals/TransferStockModal'
import ServiceOrderModal from './components/modals/ServiceOrderModal'
import NewBusinessModal from './components/modals/NewBusinessModal'
import LicenseExpiredModal from './components/modals/LicenseExpiredModal'
import PostSaleTriggerModal from './components/modals/PostSaleTriggerModal'
import OnboardingModal from './components/modals/OnboardingModal'

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
  const [showCocina, setShowCocina] = useState(() => localStorage.getItem('lioncore_showCocina') === 'true')
  const [serverInfo, setServerInfo] = useState<{ip: string; url: string; qr: string | null} | null>(null)
  const [showServerInfo, setShowServerInfo] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [showMoveMesaModal, setShowMoveMesaModal] = useState(false)
  const [moveTargetMesaId, setMoveTargetMesaId] = useState<number | null>(null)
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
  const [showOnboarding, setShowOnboarding] = useState(false)
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
  const [appVersion] = useState('2.0.0')
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
    getAllBusinesses().then(async bizs => {
      setBusinesses(bizs)
      const current = bizs.find(b => b.id === currentBusinessId)
      if (current) setCurrentBusinessType(current.tipo || 'pos')
      const onboardingDone = localStorage.getItem('lioncore_onboarding_done')
      if (!onboardingDone && bizs.length <= 1) {
        const productCount = await db.products.where('businessId').equals(currentBusinessId).count()
        if (productCount === 0) {
          setShowOnboarding(true)
        }
      }
    })
    setInvConfig(getInventoryConfig())
    loadWarehouses()
    getProducts().then(setProducts)
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

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout>
    const connect = () => {
      try {
        ws = new WebSocket(`ws://${window.location.hostname}:3456`)
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data)
            if (msg.type === 'sync' && msg.data?.mesas) {
              setMesas(msg.data.mesas)
            }
            if (msg.type === 'pedido_nuevo' || msg.type === 'mesa_actualizada') {
              getMesas().then(setMesas)
            }
          } catch {}
        }
        ws.onclose = () => { reconnectTimer = setTimeout(connect, 3000) }
      } catch {}
    }
    connect()
    return () => { if (ws) ws.close(); clearTimeout(reconnectTimer) }
  }, [])

  const fetchServerInfo = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:3456/api/ip`)
      const data = await res.json()
      setServerInfo(data)
      setShowServerInfo(true)
    } catch {
      showNotification('error', 'Servidor local no disponible')
    }
  }

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
      const blockSales = invMode.blockSales && !invConfig.sellWithoutStock

      if (blockSales) {
        for (const item of items) {
          const stock = await getProductStock(item.producto)
          if (stock < item.cantidad) {
            showNotification('error', `Stock insuficiente para "${item.producto}". Disponible: ${stock}, requerido: ${item.cantidad}`)
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

          <AppHeader
            licenseState={licenseState}
            licenseStatusCheck={licenseStatusCheck}
            currentTpl={currentTpl}
            currentBusinessType={currentBusinessType}
            showConfig={showConfig}
            showSummary={showSummary}
            showHistory={showHistory}
            showInventory={showInventory}
            showProduction={showProduction}
            showFruverDashboard={showFruverDashboard}
            showServices={showServices}
            showMoreMenu={showMoreMenu}
            onShowDeviceModal={() => setShowDeviceModal(true)}
            onShowLicenseModal={() => setShowLicenseModal(true)}
            onShowUpgradeModal={(msg: {title: string; message: string}) => setShowUpgradeModal(msg)}
            onToggleConfig={() => { setShowConfig(!showConfig); setShowSummary(false); setShowHistory(false); setShowInventory(false); }}
            onToggleInventory={() => { setShowInventory(!showInventory); setShowSummary(false); setShowHistory(false); setShowConfig(false); }}
            onToggleProduction={() => { setShowProduction(!showProduction); setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false) }}
            onToggleFruverDashboard={() => { setShowFruverDashboard(!showFruverDashboard); setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false); setShowProduction(false) }}
            onToggleServices={() => { setShowServices(!showServices); setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false); setShowProduction(false); setShowFruverDashboard(false) }}
            onToggleSummary={() => { handleToggleSummary(); setShowHistory(false); setShowInventory(false); setShowConfig(false); }}
            onToggleHistory={() => { handleToggleHistory(); setShowSummary(false); setShowInventory(false); setShowConfig(false); }}
            onToggleMoreMenu={() => setShowMoreMenu(!showMoreMenu)}
            onSetShowMoreMenu={(v: boolean) => setShowMoreMenu(v)}
            onSetShowReferrals={(v: boolean) => setShowReferrals(v)}
            onExportCSV={async () => {
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
            onLoadProductionData={async () => {
              await loadProductionData()
            }}
            onLoadFruverDashboard={async () => {
              await loadFruverDashboard()
            }}
            onLoadServiceOrders={async () => {
              await loadServiceOrders()
            }}
            onSetInventory={(data: any[]) => setInventory(data)}
            isFeatureAllowed={isFeatureAllowed}
            getUpgradeMessage={getUpgradeMessage}
            getStockByProduct={getStockByProduct}
          />

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
                <RestaurantModule
                  mesas={mesas} setMesas={setMesas}
                  selectedMesa={selectedMesa} setSelectedMesa={setSelectedMesa}
                  showCocina={showCocina} setShowCocina={setShowCocina}
                  serverInfo={serverInfo} showServerInfo={showServerInfo} setShowServerInfo={setShowServerInfo}
                  fetchServerInfo={fetchServerInfo}
                  products={products}
                  showMesaProductSelect={showMesaProductSelect} setShowMesaProductSelect={setShowMesaProductSelect}
                  mesaSelectedProduct={mesaSelectedProduct} setMesaSelectedProduct={setMesaSelectedProduct}
                  mesaProductQty={mesaProductQty} setMesaProductQty={setMesaProductQty}
                  mesaSelectedPrice={mesaSelectedPrice} setMesaSelectedPrice={setMesaSelectedPrice}
                  showPaymentModal={showPaymentModal} setShowPaymentModal={setShowPaymentModal}
                  paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                  showMoveMesaModal={showMoveMesaModal} setShowMoveMesaModal={setShowMoveMesaModal}
                  moveTargetMesaId={moveTargetMesaId} setMoveTargetMesaId={setMoveTargetMesaId}
                  showNotification={showNotification}
                  loadTodayWow={loadTodayWow}
                  currentBusinessType={currentBusinessType}
                />
              )}
            </>
          )}

          <ConfigView
            show={showConfig}
            businesses={businesses}
            currentBusinessId={currentBusinessId}
            currentTpl={currentTpl}
            onSwitchBusiness={(id: number) => { setCurrentBusinessId(id); window.location.reload() }}
            onDeleteBusiness={async (id: number) => { await deleteBusiness(id); window.location.reload() }}
            onUpdateBusinessType={async (id: number, tipo: BusinessType) => { await updateBusinessType(id, tipo); window.location.reload() }}
            onNewBusiness={() => { setShowNewBusinessModal(true); setNewBusinessName(''); setNewBusinessType('pos') }}
            invConfig={invConfig}
            onToggleSellWithoutStock={() => { setInvConfig({ ...invConfig, sellWithoutStock: !invConfig.sellWithoutStock }); saveInventoryConfig({ ...invConfig, sellWithoutStock: !invConfig.sellWithoutStock }) }}
            onToggleLowStockAlert={() => { setInvConfig({ ...invConfig, lowStockAlert: !invConfig.lowStockAlert }); saveInventoryConfig({ ...invConfig, lowStockAlert: !invConfig.lowStockAlert }) }}
            onLowStockThresholdChange={(v: number) => { setInvConfig({ ...invConfig, lowStockThreshold: v }); saveInventoryConfig({ ...invConfig, lowStockThreshold: v }) }}
            onAllowNegativeChange={(v: boolean) => { setInvConfig({ ...invConfig, allowNegative: v }); saveInventoryConfig({ ...invConfig, allowNegative: v }) }}
            onOpenInvAdjust={() => setShowInvAdjustModal(true)}
            showInventorySection={getInventoryMode(currentBusinessType).showInventory}
            businessConfig={businessConfig}
            onConfigFieldChange={(field: string, value: string) => { setBusinessConfig((prev: any) => ({ ...prev, [field]: value })); setConfigSaved(false) }}
            configSaved={configSaved}
            onSaveConfig={async () => {
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
          />

          <SummaryView
            show={showSummary}
            summaryPeriod={summaryPeriod}
            onPeriodChange={handlePeriodChange}
            loadingSummary={loadingSummary}
            summary={summary}
            netProfit={netProfit}
            loadingNetProfit={loadingNetProfit}
          />

          <InventoryView
            show={showInventory}
            inventory={inventory}
            inventorySearch={inventorySearch}
            onSearchChange={setInventorySearch}
            invConfig={invConfig}
            inlineEditField={inlineEditField}
            onInlineEditStart={setInlineEditField}
            onInlineEditChange={setInlineEditField}
            onInlineSave={handleInlineSave}
            unidad={currentTpl.unidad}
            onSelectProduct={(name) => { setProducto(name); setShowInventory(false) }}
            onSetLastPrice={(price) => setPrecio(price)}
            onPurchase={openPurchaseModal}
            onAdjust={openQuickAdjust}
            onEdit={openEditProduct}
            canPurchase={isFeatureAllowed('compra')}
            canAdjust={isFeatureAllowed('config')}
          />

          <ProductionView
            show={showProduction}
            productionDashboard={productionDashboard as any}
            rawMaterial={productionRawMaterial}
            onRawMaterialChange={setProductionRawMaterial}
            rawMaterials={rawMaterials as any}
            finalProduct={productionFinalProduct}
            onFinalProductChange={setProductionFinalProduct}
            finalProducts={finalProducts as any}
            rawQty={productionRawQty}
            onRawQtyChange={setProductionRawQty}
            finalQty={productionFinalQty}
            onFinalQtyChange={setProductionFinalQty}
            notes={productionNotes}
            onNotesChange={setProductionNotes}
            calcRendimiento={Number(calculatedRendimiento())}
            onRegister={handleProduction}
            productions={productions as any}
          />

          <FruverView
            show={showFruverDashboard}
            fruverDashboard={fruverDashboard as any}
            onRegisterWaste={() => setShowWasteModal(true)}
          />

          {showWasteModal && (
            <WasteModal
              show={showWasteModal}
              wasteProduct={wasteProduct}
              wasteQty={wasteQty}
              wasteReason={wasteReason}
              inventory={inventory}
              onProductChange={setWasteProduct}
              onQtyChange={setWasteQty}
              onReasonChange={setWasteReason}
              onRegister={handleRegisterWaste}
              onClose={() => setShowWasteModal(false)}
            />
          )}

          {!showHistory && !showSummary && !showConfig && !showInventory && !showProduction && !showFruverDashboard && (
            <TransactionForm
              mode={mode}
              onModeChange={setMode}
              producto={producto}
              onProductoChange={setProducto}
              cantidad={cantidad}
              onCantidadChange={(v) => setCantidad(Math.max(1, v))}
              precio={precio}
              onPrecioChange={setPrecio}
              editingId={editingId}
              items={items}
              total={total}
              loading={loading}
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
              customerPhone={customerPhone}
              onCustomerPhoneChange={setCustomerPhone}
              showProductionDetails={showProductionDetails}
              onToggleProductionDetails={() => setShowProductionDetails(!showProductionDetails)}
              productionMeta={productionMeta}
              onProductionMetaChange={(field, value) => setProductionMeta((prev: any) => ({ ...prev, [field]: value }))}
              currentTpl={currentTpl}
              licenseState={licenseState}
              currentBusinessId={currentBusinessId}
              availableModes={getAvailableModes()}
              onAgregar={handleAgregar}
              onActualizar={handleActualizar}
              onCancelarEdicion={handleCancelarEdicion}
              onEditar={handleEditar}
              onEliminar={handleEliminar}
              onGuardar={handleGuardar}
              onImprimir={handleImprimir}
              onWhatsApp={handleSendWhatsApp}
            />
          )}

          <HistoryView
            show={showHistory}
            transactions={transactions as any}
            loadingHistory={loadingHistory}
          />

          {showLicenseModal && (
            <LicenseModal
              show={showLicenseModal}
              email={licenseEmail}
              status={licenseStatus}
              debug={licenseDebug}
              onEmailChange={(v) => { setLicenseEmail(v); setLicenseStatus(null) }}
              onActivate={handleActivateLicense}
              onClose={() => { setShowLicenseModal(false); setLicenseStatus(null); setLicenseEmail('') }}
              onShowPayment={() => { setShowLicenseModal(false); setShowPaymentModal(true) }}
              onFetchSheetData={async () => {
                try {
                  const data = await fetchSheetData()
                  setLicenseDebug(JSON.stringify(data, null, 2))
                } catch (e: any) {
                  setLicenseDebug(`Error: ${e.message}`)
                }
              }}
            />
          )}

          {showPaymentModal && (
            <PaymentQrModal
              show={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              onCashPayment={() => {
                saveLicenseState({
                  email: 'efectivo-local',
                  plan: 'pro',
                  isActivated: true,
                  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                  lastChecked: new Date().toISOString(),
                  lastOnlineCheck: new Date().toISOString(),
                  deviceId: getDeviceId(),
                })
                setShowPaymentModal(false)
                showNotification('success', 'Licencia PRO activada por pago en efectivo')
                setTimeout(() => window.location.reload(), 1500)
              }}
            />
          )}

          {showUpgradeModal && (
            <UpgradeModal
              show={showUpgradeModal}
              onClose={() => setShowUpgradeModal(null)}
              onPay={() => { setShowUpgradeModal(null); setShowPaymentModal(true) }}
            />
          )}

          {showReferrals && (
            <ReferralsModal
              show={showReferrals}
              onClose={() => setShowReferrals(false)}
            />
          )}

          <ServicesView
            show={showServices}
            serviceOrders={serviceOrders}
            onNewOrder={() => setShowServiceModal(true)}
            onUpdateStatus={async (orderId, status) => { await handleUpdateServiceStatus(orderId, status as any) }}
            onSendWhatsApp={async (phone, device, price) => { await sendWhatsAppReceipt(phone, `Servicio ${device}`, price) }}
          />

          <WarehousesView
            warehouses={warehouses}
            selectedWarehouse={selectedWarehouse}
            warehouseStock={warehouseStock}
            onSelectWarehouse={(id) => { setSelectedWarehouse(id); loadWarehouseStock(id) }}
            onDeleteWarehouse={(id) => handleDeleteWarehouse(id)}
            onNewWarehouse={() => setShowWarehouseModal(true)}
            onTransfer={() => setShowTransferModal(true)}
          />

          {showServiceModal && (
            <ServiceOrderModal
              show={showServiceModal}
              serviceClientName={serviceClientName}
              serviceClientPhone={serviceClientPhone}
              serviceDevice={serviceDevice}
              serviceProblem={serviceProblem}
              serviceCost={serviceCost}
              servicePrice={servicePrice}
              onClientNameChange={setServiceClientName}
              onClientPhoneChange={setServiceClientPhone}
              onDeviceChange={setServiceDevice}
              onProblemChange={setServiceProblem}
              onCostChange={setServiceCost}
              onPriceChange={setServicePrice}
              onCreate={handleCreateServiceOrder}
              onClose={() => setShowServiceModal(false)}
            />
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
            <DeviceModal
              show={showDeviceModal}
              deviceId={getDeviceId()}
              licenseState={licenseState}
              licenseStatusCheck={licenseStatusCheck}
              onClose={() => setShowDeviceModal(false)}
              onDeactivate={() => { deactivateLicense(); setShowDeviceModal(false); window.location.reload() }}
            />
          )}

          {showInvAdjustModal && (
            <InvAdjustModal
              show={showInvAdjustModal}
              product={adjustProduct}
              qty={adjustQty}
              reason={adjustReason}
              onProductChange={setAdjustProduct}
              onQtyChange={setAdjustQty}
              onReasonChange={setAdjustReason}
              onSubmit={() => {
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
              onClose={() => { setShowInvAdjustModal(false); setAdjustProduct(''); setAdjustQty(0); setAdjustReason('') }}
            />
          )}

          {showNewBusinessModal && (
            <NewBusinessModal
              show={showNewBusinessModal}
              newBusinessName={newBusinessName}
              newBusinessType={newBusinessType}
              onNameChange={setNewBusinessName}
              onTypeChange={setNewBusinessType}
              onCreate={async () => {
                if (!newBusinessName) return
                try {
                  const newId = await createBusiness(newBusinessName, newBusinessType)
                  setCurrentBusinessId(newId)
                  window.location.reload()
                } catch (e: any) {
                  showNotification('error', `Error: ${e.message}`)
                }
              }}
              onClose={() => { setShowNewBusinessModal(false); setNewBusinessName('') }}
            />
          )}

          {licenseStatusCheck.isExpired && (
            <LicenseExpiredModal
              onFreeMode={() => { deactivateLicense(); window.location.reload() }}
              onPay={() => setShowLicenseModal(true)}
            />
          )}

          {showAddProduct && (
            <AddProductModal
              show={showAddProduct}
              newProductName={newProductName}
              newProductPrice={newProductPrice}
              newProductCost={newProductCost}
              newProductStock={newProductStock}
              onNameChange={setNewProductName}
              onPriceChange={setNewProductPrice}
              onCostChange={setNewProductCost}
              onStockChange={setNewProductStock}
              onSave={handleAddProduct}
              onClose={() => setShowAddProduct(false)}
            />
          )}

          {showEditProduct && (
            <EditProductModal
              show={showEditProduct}
              editProductName={editProductName}
              editProductPrice={editProductPrice}
              editProductCost={editProductCost}
              editProductStock={editProductStock}
              onNameChange={setEditProductName}
              onPriceChange={setEditProductPrice}
              onCostChange={setEditProductCost}
              onStockChange={setEditProductStock}
              onSave={handleUpdateProduct}
              onClose={() => setShowEditProduct(false)}
            />
          )}

          {showQuickPurchase && (
            <QuickPurchaseModal
              show={showQuickPurchase}
              quickPurchaseProduct={quickPurchaseProduct}
              quickPurchaseQty={quickPurchaseQty}
              quickPurchaseCost={quickPurchaseCost}
              onQtyChange={setQuickPurchaseQty}
              onCostChange={setQuickPurchaseCost}
              onSave={handleQuickPurchase}
              onClose={() => setShowQuickPurchase(false)}
            />
          )}

          {showQuickAdjust && (
            <QuickAdjustModal
              show={showQuickAdjust}
              quickAdjustProduct={quickAdjustProduct}
              quickAdjustQty={quickAdjustQty}
              quickAdjustType={quickAdjustType}
              onQtyChange={setQuickAdjustQty}
              onTypeChange={setQuickAdjustType}
              onSave={handleQuickAdjust}
              onClose={() => setShowQuickAdjust(false)}
            />
          )}

          {showWarehouseModal && (
            <NewWarehouseModal
              show={showWarehouseModal}
              newWarehouseName={newWarehouseName}
              newWarehouseAddress={newWarehouseAddress}
              onNameChange={setNewWarehouseName}
              onAddressChange={setNewWarehouseAddress}
              onCreate={handleCreateWarehouse}
              onClose={() => setShowWarehouseModal(false)}
            />
          )}

          {showTransferModal && (
            <TransferStockModal
              show={showTransferModal}
              transferFrom={transferFrom}
              transferTo={transferTo}
              transferProduct={transferProduct}
              transferQty={transferQty}
              warehouses={warehouses}
              onFromChange={setTransferFrom}
              onToChange={setTransferTo}
              onProductChange={setTransferProduct}
              onQtyChange={setTransferQty}
              onTransfer={handleTransferStock}
              onClose={() => setShowTransferModal(false)}
            />
          )}

          {showOnboarding && (
            <OnboardingModal
              show={showOnboarding}
              currentBusinessId={currentBusinessId}
              newBusinessName={newBusinessName}
              newProductName={newProductName}
              newProductPrice={newProductPrice}
              onBusinessNameChange={setNewBusinessName}
              onProductNameChange={setNewProductName}
              onProductPriceChange={setNewProductPrice}
              onCreateBusiness={(name, tipo) => {
                createBusiness(name, tipo).then(id => {
                  setCurrentBusinessId(id)
                  window.location.reload()
                })
              }}
              onComplete={() => {
                setShowOnboarding(false)
                localStorage.setItem('lioncore_onboarding_done', 'true')
              }}
              showNotification={showNotification}
            />
          )}

          {showPostSaleTrigger && (
            <PostSaleTriggerModal
              show={showPostSaleTrigger}
              isActivated={licenseState.isActivated}
              onActivate={() => { setShowPostSaleTrigger(false); setShowLicenseModal(true) }}
              onViewSummary={() => setShowPostSaleTrigger(false)}
              onClose={() => setShowPostSaleTrigger(false)}
            />
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