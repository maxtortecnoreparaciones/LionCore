import { useState, useEffect, useRef } from 'react'
import { getAllTransactions, Transaction, getDailySummary, getWeeklySummary, getMonthlySummary, FinancialSummary, getTransactionMeta, db, getProductStock, getOrCreateDefaultBusiness, createTransaction, saveTransactionMeta, getStockByProduct, saveBusinessConfig, getAllBusinesses, createBusiness, deleteBusiness, updateBusinessType, Business, BusinessType, businessTemplates, getNetProfitSummary, NetProfitSummary, setCurrentBusinessId, Mesa, getMesas, resetAllMesas, setOrderItemStatus, InventoryConfig, getInventoryConfig, saveInventoryConfig, adjustInventory, getInventoryMode, createServiceOrder, updateServiceOrderStatus, getServiceOrders, ServiceOrder, upsertCustomer, sendWhatsAppReceipt, getProducts, Product, getDefaultUnit, generateNextProductCode, deleteProduct, isWeightUnit } from './services/db'
import { getLicenseState, isFeatureAllowed, activateLicense, checkLicenseStatus, refreshLicenseCheck, getUpgradeMessage, getDeviceId, deactivateLicense, fetchSheetData, saveLicenseState } from './services/license'
import { isElectron, syncSave, syncSaveKeepalive } from './services/persistence'
import RestaurantModule from './components/restaurant/RestaurantModule'
import CocinaView from './components/restaurant/CocinaView'
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
// ProductionView reemplazado por ProcessExecutionView (Issue #249)
import { FruverView } from './components/views/FruverView'
import ServicesView from './components/views/ServicesView'
import CustomersView from './components/views/CustomersView'
import SuppliersView from './components/views/SuppliersView'
import InventoryHistoryView from './components/views/InventoryHistoryView'
import CategoriesView from './components/views/CategoriesView'
import ProcessConfigView from './components/views/ProcessConfigView'
import ProcessExecutionView from './components/views/ProcessExecutionView'
import ResourcesView from './components/views/ResourcesView'
import { formatCOP } from './utils/format'
import InvoicePreview from './components/modals/InvoicePreview'
import WasteModal from './components/modals/WasteModal'
import AddProductModal from './components/modals/AddProductModal'
import EditProductModal from './components/modals/EditProductModal'
import QuickPurchaseModal from './components/modals/QuickPurchaseModal'
import QuickAdjustModal from './components/modals/QuickAdjustModal'
import ServiceOrderModal from './components/modals/ServiceOrderModal'
import NewBusinessModal from './components/modals/NewBusinessModal'
import LicenseExpiredModal from './components/modals/LicenseExpiredModal'
import PostSaleTriggerModal from './components/modals/PostSaleTriggerModal'
import OnboardingModal from './components/modals/OnboardingModal'

type Mode = 'venta' | 'compra' | 'gasto' | 'produccion'

interface Item {
  id: number
  producto: string
  code?: string
  unit?: string
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
  
  const routePath = (() => {
    const p = window.location.pathname.replace(/\/$/, '') || '/'
    return p
  })()
  const isKitchenRoute = routePath === '/kitchen'
  const isWaiterRoute = routePath === '/waiter'
  
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
  const [showFruverDashboard, setShowFruverDashboard] = useState(false)
  const [fruverDashboard, setFruverDashboard] = useState<{ventasHoy: number; mermaHoy: number; gananciaHoy: number; productosCriticos: {name: string; code?: string; stock: number; diasRestantes: number}[]} | null>(null)
  const [showWasteModal, setShowWasteModal] = useState(false)
  const [wasteProduct, setWasteProduct] = useState('')
  const [wasteQty, setWasteQty] = useState('')
  const [wasteReason, setWasteReason] = useState('')
  const [showServices, setShowServices] = useState(false)
  const [showCustomers, setShowCustomers] = useState(false)
  const [showSuppliers, setShowSuppliers] = useState(false)
  const [showInventoryHistory, setShowInventoryHistory] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [showProcessConfig, setShowProcessConfig] = useState(false)
  const [showProcessExecution, setShowProcessExecution] = useState(false)
  const [showResources, setShowResources] = useState(false)
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
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [newProductCost, setNewProductCost] = useState('')
  const [newProductStock, setNewProductStock] = useState('')
  const [newProductUnit, setNewProductUnit] = useState(getDefaultUnit(currentBusinessType))
  const [newProductPricingMode, setNewProductPricingMode] = useState('UNIT')
  const [newProductProveedor, setNewProductProveedor] = useState('')
  const [newProductCategoria, setNewProductCategoria] = useState('')
  const [newProductMargin, setNewProductMargin] = useState('')
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [editProductId, setEditProductId] = useState<number | null>(null)
  const [editProductCode, setEditProductCode] = useState('')
  const [editProductQR, setEditProductQR] = useState('')
  const [editProductName, setEditProductName] = useState('')
  const [editProductPrice, setEditProductPrice] = useState('')
  const [editProductCost, setEditProductCost] = useState('')
  const [editProductStock, setEditProductStock] = useState('')
  const [editProductUnit, setEditProductUnit] = useState('')
  const [editProductProveedor, setEditProductProveedor] = useState('')
  const [editProductCategoria, setEditProductCategoria] = useState('')
  const [editProductPricingMode, setEditProductPricingMode] = useState('UNIT')
  const [editProductMargin, setEditProductMargin] = useState('')
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

  const autoSaveRef = useRef<ReturnType<typeof setInterval>>(undefined)
  useEffect(() => {
    let mounted = true
    let cleanup: (() => void) | undefined
    ;(async () => {
      const electron = await isElectron()
      if (!electron || !mounted) return
      const doSave = async () => {
        const result = await syncSave()
        if (!result.ok && result.error !== 'No disponible en modo web') {
          console.warn('Auto-save failed:', result.error)
        }
      }
      doSave()
      autoSaveRef.current = setInterval(doSave, 5 * 60 * 1000)
      const handleBeforeUnload = () => { syncSaveKeepalive() }
      window.addEventListener('beforeunload', handleBeforeUnload)
      cleanup = () => {
        if (autoSaveRef.current) clearInterval(autoSaveRef.current)
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    })()
    return () => {
      mounted = false
      cleanup?.()
    }
  }, [])

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

  const handleAgregar = async () => {
    const precioNum = Number(String(precio).replace(',', '.'))
    if (!producto.trim() || cantidad <= 0 || !precio || precioNum <= 0) {
      showNotification('error', 'Completa todos los campos')
      return
    }

    const product = await db.products.where({ businessId: currentBusinessId, name: producto.trim() }).first()
    const defaultUnit = getDefaultUnit(currentBusinessType)
    if (!product) {
      const code = await generateNextProductCode(currentBusinessId, currentBusinessType)
      await db.products.add({
        businessId: currentBusinessId,
        code,
        name: producto.trim(),
        price: precioNum,
        stock: 0,
        unidad: defaultUnit,
        pricingMode: 'UNIT',
        createdAt: new Date(),
      })
    }
    const newItem: Item = {
      id: Date.now(),
      producto: producto.trim(),
      code: product?.code,
      unit: product?.unidad || defaultUnit,
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

    const precioNum = Number(String(precio).replace(',', '.'))
    if (!producto.trim() || cantidad <= 0 || !precio || precioNum <= 0) {
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
      const productMap = new Map<string, { id?: number; cost?: number; unit?: string; code?: string }>()
      products.forEach(p => productMap.set(p.name.toLowerCase(), { id: p.id, cost: p.cost, unit: p.unidad, code: p.code }))

      for (const item of items) {
        if (!productMap.has(item.producto.toLowerCase())) {
          const code = await generateNextProductCode(currentBusinessId, currentBusinessType)
          const unit = getDefaultUnit(currentBusinessType)
          const newId = await db.products.add({
            businessId: currentBusinessId,
            code,
            name: item.producto,
            price: item.precio,
            stock: 0,
            unidad: unit,
            pricingMode: 'UNIT',
            createdAt: new Date(),
          })
          productMap.set(item.producto.toLowerCase(), { id: newId, unit, code })
        }
      }

      const transactionItems = items.map(item => {
        const isProduction = mode === 'produccion'
        const kgQuantity = isProduction && productionMeta.pesoSalida ? Number(productionMeta.pesoSalida) : item.cantidad
        const productInfo = productMap.get(item.producto.toLowerCase())
        const productCost = productInfo?.cost
        return {
          name: item.producto,
          productId: productInfo?.id,
          quantity: kgQuantity,
          price: item.precio,
          subtotal: kgQuantity * item.precio,
          costUnitario: productCost ?? (isProduction ? item.precio / kgQuantity : undefined),
          unit: productInfo?.unit,
          code: item.code,
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
      showNotification('error', 'Ingresa un precio de venta válido')
      return
    }
    try {
      const code = await generateNextProductCode(currentBusinessId, currentBusinessType)
      const isWeight = isWeightUnit(newProductUnit)
      const pricingMode = isWeight ? 'WEIGHT' : 'UNIT'
      const qty = Number(newProductStock) || 0
      const totalCost = Number(newProductCost) || 0
      const costPerUnit = qty > 0 && totalCost > 0 ? totalCost / qty : (Number(newProductCost) || 0)

      const productId = await db.products.add({
        businessId: currentBusinessId,
        code,
        name: newProductName.trim(),
        price: Number(newProductPrice),
        cost: costPerUnit,
        stock: qty,
        unidad: newProductUnit,
        pricingMode: pricingMode as 'UNIT' | 'WEIGHT',
        proveedor: newProductProveedor.trim() || undefined,
        categoria: newProductCategoria.trim() || undefined,
        margin: newProductMargin ? Number(newProductMargin) : undefined,
        createdAt: new Date(),
      })

      if (qty > 0 && totalCost > 0) {
        const txId = await db.transactions.add({
          businessId: currentBusinessId,
          type: 'compra',
          total: totalCost,
          date: new Date(),
        })
        await db.transaction_items.add({
          transactionId: txId,
          productId,
          name: newProductName.trim(),
          quantity: qty,
          price: costPerUnit,
          subtotal: totalCost,
          costUnitario: costPerUnit,
        })
      }

      setNewProductName('')
      setNewProductPrice('')
      setNewProductCost('')
      setNewProductStock('')
      setNewProductUnit(getDefaultUnit(currentBusinessType))
      setNewProductPricingMode('UNIT')
      setNewProductProveedor('')
      setNewProductCategoria('')
      setNewProductMargin('')
      setShowAddProduct(false)
      showNotification('success', `Producto "${newProductName.trim()}" agregado${qty > 0 && totalCost > 0 ? ' con compra registrada' : ''}`)
      const stockData = await getStockByProduct()
      setInventory(stockData)
    } catch (error) {
      console.error('Error al agregar producto:', error)
      showNotification('error', 'Error al agregar el producto')
    }
  }

  const openEditProduct = async (productName: string) => {
    const product = await db.products.where({ businessId: currentBusinessId, name: productName }).first()
    if (product) {
      setEditProductId(product.id || null)
      setEditProductCode(product.code || '')
      setEditProductQR(product.qr || '')
      setEditProductName(product.name)
      setEditProductPrice(String(product.price))
      setEditProductCost(product.cost ? String(product.cost) : '')
      setEditProductStock(product.stock ? String(product.stock) : '0')
      setEditProductUnit(product.unidad || getDefaultUnit(currentBusinessType))
      setEditProductProveedor(product.proveedor || '')
      setEditProductCategoria(product.categoria || '')
      setEditProductPricingMode(product.pricingMode || 'UNIT')
      setEditProductMargin(product.margin ? String(product.margin) : '')
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
        code: editProductCode.trim() || undefined,
        qr: editProductQR.trim() || undefined,
        name: editProductName.trim(),
        price: Number(editProductPrice),
        cost: editProductCost ? Number(editProductCost) : 0,
        stock: editProductStock ? Number(editProductStock) : 0,
        unidad: editProductUnit,
        proveedor: editProductProveedor.trim() || undefined,
        categoria: editProductCategoria.trim() || undefined,
        pricingMode: editProductPricingMode as 'UNIT' | 'WEIGHT',
        margin: editProductMargin ? Number(editProductMargin) : undefined,
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
      const isWeightProduct = product.pricingMode === 'WEIGHT'
      const costFromInput = quickPurchaseCost ? Number(quickPurchaseCost) : 0
      const costPerKg = isWeightProduct && costFromInput > 0 ? costFromInput / qty : costFromInput
      const finalCost = costPerKg || product.cost || 0
      const txId = await db.transactions.add({
        businessId: currentBusinessId,
        type: 'compra',
        total: isWeightProduct && costFromInput > 0 ? costFromInput : qty * finalCost,
        date: new Date(),
      })
      await db.transaction_items.add({
        transactionId: txId,
        productId: product.id,
        name: product.name,
        quantity: qty,
        price: finalCost,
        subtotal: isWeightProduct && costFromInput > 0 ? costFromInput : qty * finalCost,
        costUnitario: finalCost,
      })
      const newStock = (product.stock || 0) + qty
      await db.products.update(product.id!, { stock: newStock, cost: finalCost })
      const unitLabel = product.unidad || getDefaultUnit(currentBusinessType)
      setShowQuickPurchase(false)
      showNotification('success', `Compra registrada: ${qty} ${unitLabel} de ${quickPurchaseProduct}`)
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
        const product = await db.products.get(productId)
        if (!product) {
          showNotification('error', 'Producto no encontrado')
          setInlineEditField(null)
          return
        }
        const oldStock = product.stock || 0
        const diff = val - oldStock
        const updates: Record<string, number> = {}
        updates[inlineEditField.field] = val
        await db.products.update(productId, updates)
        if (inlineEditField.field === 'stock' && diff !== 0) {
          await adjustInventory(product.name, diff, `Ajuste inline: ${oldStock} → ${val}`)
        }
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
    const product = items.map(i => `${i.code ? '['+i.code+'] ' : ''}${i.producto} x${i.cantidad}`).join(', ')
    if (customerPhone) {
      await sendWhatsAppReceipt(customerPhone, product, total)
    } else {
      const msg = `Tu compra en LionCore:%0A${product}%0ATotal: $${total.toLocaleString('es-CO')}`
      window.open(`https://wa.me/573138777115?text=${msg}`, '_blank')
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

      {isKitchenRoute ? (
        <div className="min-h-screen bg-gray-100 p-4">
          <div className="w-full max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <CocinaView
                mesas={mesas}
                onCobrar={(mesa: Mesa) => showNotification('success', `Notifica al mesero: Mesa ${mesa.name} - ${formatCOP(mesa.total)}`)}
                onUpdateItemStatus={async (mesaId: number, itemIndex: number, status: 'pendiente' | 'preparando' | 'listo') => {
                  await setOrderItemStatus(mesaId, itemIndex, status)
                  getMesas().then(setMesas)
                }}
              />
            </div>
          </div>
        </div>
      ) : isWaiterRoute ? (
        <div className="min-h-screen bg-gray-100 p-4">
          <div className="w-full max-w-7xl mx-auto">
            {currentBusinessType === 'restaurante' ? (
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
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg font-semibold">⚠️ El negocio actual no es de tipo restaurante</p>
                <p className="text-sm mt-2">Abre la página principal (<code>/</code>) y selecciona o crea un negocio de tipo restaurante.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
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
            showFruverDashboard={showFruverDashboard}
            showServices={showServices}
            showCustomers={showCustomers}
            showSuppliers={showSuppliers}
            showInventoryHistory={showInventoryHistory}
            showCategories={showCategories}
            showProcessConfig={showProcessConfig}
            showProcessExecution={showProcessExecution}
            showResources={showResources}
            showMoreMenu={showMoreMenu}
            onShowDeviceModal={() => setShowDeviceModal(true)}
            onShowLicenseModal={() => setShowLicenseModal(true)}
            onShowUpgradeModal={(msg: {title: string; message: string}) => setShowUpgradeModal(msg)}
            onToggleConfig={() => { setShowConfig(!showConfig); setShowSummary(false); setShowHistory(false); setShowInventory(false); }}
            onToggleInventory={() => { setShowInventory(!showInventory); setShowSummary(false); setShowHistory(false); setShowConfig(false); }}
            onToggleFruverDashboard={() => { setShowFruverDashboard(!showFruverDashboard); setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false); setShowProduction(false) }}
            onToggleServices={() => { setShowServices(!showServices); setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false); setShowFruverDashboard(false) }}
            onToggleSummary={() => { handleToggleSummary(); setShowHistory(false); setShowInventory(false); setShowConfig(false); }}
            onToggleHistory={() => { handleToggleHistory(); setShowSummary(false); setShowInventory(false); setShowConfig(false); }}
            onToggleMoreMenu={() => setShowMoreMenu(!showMoreMenu)}
            onToggleCustomers={() => { setShowCustomers(!showCustomers); setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false); setShowServices(false); setShowProduction(false); setShowFruverDashboard(false); setShowSuppliers(false) }}
            onToggleSuppliers={() => { setShowSuppliers(!showSuppliers); setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false); setShowServices(false); setShowProduction(false); setShowFruverDashboard(false); setShowCustomers(false); setShowInventoryHistory(false) }}
            onToggleInventoryHistory={() => { setShowInventoryHistory(!showInventoryHistory); setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false); setShowServices(false); setShowProduction(false); setShowFruverDashboard(false); setShowCustomers(false); setShowSuppliers(false); setShowCategories(false) }}
            onToggleCategories={() => { setShowCategories(!showCategories); setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false); setShowServices(false); setShowProduction(false); setShowFruverDashboard(false); setShowCustomers(false); setShowSuppliers(false); setShowInventoryHistory(false) }}
            onToggleProcessConfig={() => { setShowProcessConfig(!showProcessConfig); setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false); setShowServices(false); setShowProduction(false); setShowFruverDashboard(false); setShowCustomers(false); setShowSuppliers(false); setShowInventoryHistory(false); setShowCategories(false); setShowResources(false); setShowProcessExecution(false) }}
            onToggleProcessExecution={() => { setShowProcessExecution(!showProcessExecution); setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false); setShowServices(false); setShowProduction(false); setShowFruverDashboard(false); setShowCustomers(false); setShowSuppliers(false); setShowInventoryHistory(false); setShowCategories(false); setShowProcessConfig(false); setShowResources(false) }}
            onToggleResources={() => { setShowResources(!showResources); setShowSummary(false); setShowHistory(false); setShowConfig(false); setShowInventory(false); setShowServices(false); setShowProduction(false); setShowFruverDashboard(false); setShowCustomers(false); setShowSuppliers(false); setShowInventoryHistory(false); setShowCategories(false); setShowProcessConfig(false); setShowProcessExecution(false) }}
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
            todayWow={todayWow}
            loadingWow={loadingWow}
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
            onSelectProduct={(name) => { setProducto(name); setShowInventory(false) }}
            onSetLastPrice={(price) => setPrecio(price)}
            onPurchase={openPurchaseModal}
            onAdjust={openQuickAdjust}
            onEdit={openEditProduct}
            onDelete={async (name: string) => {
              await deleteProduct(name)
              const updated = await getStockByProduct()
              setInventory(updated)
              showNotification('success', `"${name}" eliminado`)
            }}
            canPurchase={isFeatureAllowed('compra')}
            canAdjust={isFeatureAllowed('config')}
          />

          <ProcessExecutionView
            show={showProduction || showProcessExecution}
          />

          <FruverView
            show={showFruverDashboard}
            fruverDashboard={fruverDashboard as any}
            defaultUnit={getDefaultUnit(currentBusinessType)}
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
            defaultUnit={getDefaultUnit(currentBusinessType)}
          />

          <CustomersView
            show={showCustomers}
          />

          <SuppliersView
            show={showSuppliers}
          />

          <InventoryHistoryView
            show={showInventoryHistory}
          />

          <CategoriesView
            show={showCategories}
          />

          <ProcessConfigView
            show={showProcessConfig}
          />

          <ResourcesView
            show={showResources}
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

          {!showConfig && !showSummary && !showHistory && !showInventory && !showMoreMenu && !showServices && !showAddProduct && (
            <div className="fixed bottom-6 right-6 z-50">
              {fabOpen && (
                <div className="absolute bottom-16 right-0 space-y-3">
                  <button
                    onClick={() => {
                      setMode('venta')
                      setFabOpen(false)
                      setShowInventory(false); setShowConfig(false); setShowSummary(false); setShowHistory(false);
                    }}
                    className="flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-full shadow-xl hover:bg-green-700 hover:scale-105 transition-all whitespace-nowrap"
                  >
                    <span className="text-xl">💰</span> Nueva Venta
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
              newProductUnit={newProductUnit}
              newProductPricingMode={newProductPricingMode}
              newProductProveedor={newProductProveedor}
              newProductCategoria={newProductCategoria}
              newProductMargin={newProductMargin}
              onNameChange={setNewProductName}
              onPriceChange={setNewProductPrice}
              onCostChange={setNewProductCost}
              onStockChange={setNewProductStock}
              onUnitChange={(v: string) => {
                setNewProductUnit(v as any)
                if (v === 'kg' || v === 'g' || v === 'lb' || v === 'oz') setNewProductPricingMode('WEIGHT')
              }}
              onPricingModeChange={setNewProductPricingMode}
              onProveedorChange={setNewProductProveedor}
              onCategoriaChange={setNewProductCategoria}
              onMarginChange={setNewProductMargin}
              onSave={handleAddProduct}
              onClose={() => setShowAddProduct(false)}
            />
          )}

          {showEditProduct && (
            <EditProductModal
              show={showEditProduct}
              editProductCode={editProductCode}
              editProductQR={editProductQR}
              editProductName={editProductName}
              editProductPrice={editProductPrice}
              editProductCost={editProductCost}
              editProductStock={editProductStock}
              editProductUnit={editProductUnit}
              editProductProveedor={editProductProveedor}
              editProductCategoria={editProductCategoria}
              editProductPricingMode={editProductPricingMode}
              editProductMargin={editProductMargin}
              onCodeChange={setEditProductCode}
              onQRChange={setEditProductQR}
              onNameChange={setEditProductName}
              onPriceChange={setEditProductPrice}
              onCostChange={setEditProductCost}
              onStockChange={setEditProductStock}
              onUnitChange={setEditProductUnit}
              onProveedorChange={setEditProductProveedor}
              onCategoriaChange={setEditProductCategoria}
              onPricingModeChange={setEditProductPricingMode}
              onMarginChange={setEditProductMargin}
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
              pricingMode={(() => { const p = products.find(pr => pr.name === quickPurchaseProduct); return p?.pricingMode })()}
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

        </div>
      </div>
      )}
    </>
  )
}

export default App