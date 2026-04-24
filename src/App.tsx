import { useState } from 'react'
import { getAllTransactions, Transaction, getDailySummary, getWeeklySummary, getMonthlySummary, FinancialSummary } from './services/db'

type Mode = 'venta' | 'compra' | 'gasto' | 'produccion'

interface Item {
  id: number
  producto: string
  cantidad: number
  precio: number
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
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [summaryPeriod, setSummaryPeriod] = useState<'diario' | 'semanal' | 'mensual'>('diario')
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  const total = items.reduce((sum, item) => sum + item.cantidad * item.precio, 0)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadTransactions = async () => {
    setLoadingHistory(true)
    try {
      const data = await getAllTransactions()
      setTransactions(data)
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
      const { getProductStock } = await import('./services/db')
      
      for (const item of items) {
        const stock = await getProductStock(item.producto)
        if (stock < item.cantidad) {
          showNotification('error', `Stock insuficiente para "${item.producto}". Stock actual: ${stock}`)
          return
        }
      }
    }

    setLoading(true)

    try {
      const { getOrCreateDefaultBusiness, createTransaction, saveTransactionMeta } = await import('./services/db')

      await getOrCreateDefaultBusiness()

      const transactionItems = items.map(item => ({
        name: item.producto,
        quantity: item.cantidad,
        price: item.precio,
        subtotal: item.cantidad * item.precio,
        costUnitario: mode === 'produccion' ? item.precio / item.cantidad : undefined,
      }))

      const transactionId = await createTransaction(mode, transactionItems)

      if (mode === 'produccion') {
        const meta: Record<string, string | number> = {}
        if (productionMeta.pesoEntrada) meta.peso_entrada = Number(productionMeta.pesoEntrada)
        if (productionMeta.pesoSalida) meta.peso_salida = Number(productionMeta.pesoSalida)
        if (productionMeta.desperdicio) meta.desperdicio = Number(productionMeta.desperdicio)
        if (productionMeta.tiempo) meta.tiempo = Number(productionMeta.tiempo)
        
        if (Object.keys(meta).length > 0) {
          await saveTransactionMeta(transactionId, meta)
        }
      }

      setItems([])
      setProductionMeta({ pesoEntrada: '', pesoSalida: '', desperdicio: '', tiempo: '' })
      showNotification('success', 'Transacción guardada correctamente')

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAgregar()
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

      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">LionCore POS</h1>
            <div className="flex gap-2">
              <button
                onClick={handleToggleSummary}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  showSummary ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {showSummary ? '← Volver' : '📊 Resumen'}
              </button>
              <button
                onClick={handleToggleHistory}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  showHistory ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {showHistory ? '← Volver' : '📋 Historial'}
              </button>
            </div>
          </div>

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
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400">Sin datos</div>
              )}
            </div>
          )}

          {!showHistory && !showSummary && (
            <>
              <p className="text-center text-sm text-gray-500">Negocio ID: 1</p>

              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex gap-2">
                  {(['venta', 'compra', 'gasto', 'produccion'] as Mode[]).map((m) => (
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
                  <input
                    type="text"
                    placeholder={editingId ? 'Editando producto...' : 'Producto'}
                    value={producto}
                    onChange={(e) => setProducto(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`flex-2 flex-1 py-3 px-4 border rounded-lg focus:outline-none focus:ring-2 ${
                      editingId ? 'border-amber-400 bg-amber-50' : 'border-gray-200 focus:ring-blue-500'
                    } focus:border-transparent`}
                  />
                  <input
                    type="number"
                    placeholder="Cant"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                    min={1}
                    onKeyPress={handleKeyPress}
                    className={`w-20 py-3 px-3 text-center border rounded-lg focus:outline-none focus:ring-2 ${
                      editingId ? 'border-amber-400 bg-amber-50' : 'border-gray-200 focus:ring-blue-500'
                    } focus:border-transparent`}
                  />
                  <input
                    type="number"
                    placeholder="Precio"
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

              {mode === 'produccion' && (
                <div className="bg-white rounded-xl shadow-md p-4">
                  <button
                    onClick={() => setShowProductionDetails(!showProductionDetails)}
                    className="text-blue-600 font-semibold text-sm flex items-center gap-2"
                  >
                    {showProductionDetails ? '▼ Ocultar detalles' : '+ Ver más detalles'}
                  </button>

                  {showProductionDetails && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
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

              <div className="flex gap-3">
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
        </div>
      </div>
    </>
  )
}

export default App