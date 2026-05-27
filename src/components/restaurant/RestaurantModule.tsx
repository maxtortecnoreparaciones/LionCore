import { Mesa, Product, openMesa, addToMesa, removeItemFromMesa, closeMesa, setMesaStatus, moveMesaItems, getMesas, resetAllMesas, setOrderItemStatus } from '../../services/db'
import { formatCOP } from '../../utils/format'
import MesaCard from './MesaCard'
import MesaDetail from './MesaDetail'
import CocinaView from './CocinaView'
import ServerInfo from './ServerInfo'
import MesaProductModal from './MesaProductModal'
import MoveMesaModal from './MoveMesaModal'
import PaymentModal from './PaymentModal'

interface RestaurantModuleProps {
  mesas: Mesa[]
  setMesas: React.Dispatch<React.SetStateAction<Mesa[]>>
  selectedMesa: Mesa | null
  setSelectedMesa: React.Dispatch<React.SetStateAction<Mesa | null>>
  showCocina: boolean
  setShowCocina: React.Dispatch<React.SetStateAction<boolean>>
  serverInfo: { ip: string; url: string; qr: string | null } | null
  showServerInfo: boolean
  setShowServerInfo: React.Dispatch<React.SetStateAction<boolean>>
  fetchServerInfo: () => void
  products: Product[]
  showMesaProductSelect: boolean
  setShowMesaProductSelect: React.Dispatch<React.SetStateAction<boolean>>
  mesaSelectedProduct: string
  setMesaSelectedProduct: React.Dispatch<React.SetStateAction<string>>
  mesaProductQty: number
  setMesaProductQty: React.Dispatch<React.SetStateAction<number>>
  mesaSelectedPrice: number
  setMesaSelectedPrice: React.Dispatch<React.SetStateAction<number>>
  showPaymentModal: boolean
  setShowPaymentModal: React.Dispatch<React.SetStateAction<boolean>>
  paymentMethod: string
  setPaymentMethod: React.Dispatch<React.SetStateAction<string>>
  showMoveMesaModal: boolean
  setShowMoveMesaModal: React.Dispatch<React.SetStateAction<boolean>>
  moveTargetMesaId: number | null
  setMoveTargetMesaId: React.Dispatch<React.SetStateAction<number | null>>
  showNotification: (type: 'success' | 'error', message: string) => void
  loadTodayWow: () => void
  currentBusinessType: string
}

const RestaurantModule: React.FC<RestaurantModuleProps> = ({
  mesas, setMesas, selectedMesa, setSelectedMesa,
  showCocina, setShowCocina,
  serverInfo, showServerInfo, setShowServerInfo, fetchServerInfo,
  products,
  showMesaProductSelect, setShowMesaProductSelect,
  mesaSelectedProduct, setMesaSelectedProduct,
  mesaProductQty, setMesaProductQty,
  mesaSelectedPrice, setMesaSelectedPrice,
  showPaymentModal, setShowPaymentModal,
  paymentMethod, setPaymentMethod,
  showMoveMesaModal, setShowMoveMesaModal,
  moveTargetMesaId, setMoveTargetMesaId,
  showNotification, loadTodayWow,
  currentBusinessType,
}) => {
  const handleMesaClick = (mesa: Mesa) => {
    if (mesa.status === 'disponible') {
      openMesa(mesa.id!).then(() => getMesas().then(m => {
        setMesas(m)
        const found = m.find(x => x.id === mesa.id)
        if (found) setSelectedMesa(found)
      }))
    } else {
      getMesas().then(m => {
        const found = m.find(x => x.id === mesa.id)
        if (found) setSelectedMesa(found)
      })
    }
  }

  const handleRemoveItem = (mesaId: number, idx: number) => {
    removeItemFromMesa(mesaId, idx).then(() => getMesas().then(m => {
      setMesas(m)
      const found = m.find(x => x.id === mesaId)
      if (found) setSelectedMesa(found)
    }))
  }

  const handleAddProduct = () => {
    if (mesaSelectedProduct && mesaSelectedPrice > 0 && selectedMesa) {
      const product = products.find(p => p.name === mesaSelectedProduct)
      addToMesa(selectedMesa.id!, {
        name: mesaSelectedProduct,
        code: product?.code,
        quantity: mesaProductQty,
        price: mesaSelectedPrice,
        subtotal: mesaProductQty * mesaSelectedPrice,
      }).then(() => getMesas().then(m => {
        setMesas(m)
        const found = m.find(x => x.id === selectedMesa.id)
        if (found) setSelectedMesa(found)
        setShowMesaProductSelect(false)
        setMesaSelectedProduct('')
        setMesaProductQty(1)
        setMesaSelectedPrice(0)
      }))
    }
  }

  const handleSolicitarCuenta = (mesaId: number) => {
    setMesaStatus(mesaId, 'cuenta').then(() => getMesas().then(m => {
      setMesas(m)
      const found = m.find(x => x.id === mesaId)
      if (found) setSelectedMesa(found)
      showNotification('success', 'Cuenta solicitada')
    }))
  }

  const handleWhatsApp = (mesa: Mesa) => {
    const items = mesa.orderItems.map(i => `• ${i.code ? '['+i.code+'] ' : ''}${i.quantity}× ${i.name} = ${formatCOP(i.subtotal)}`).join('\n')
    const msg = encodeURIComponent(`🧾 *Cuenta - ${mesa.name}*\n\n${items}\n\n*Total: ${formatCOP(mesa.total)}*`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const handleMoveConfirm = () => {
    if (selectedMesa && moveTargetMesaId) {
      moveMesaItems(selectedMesa.id!, moveTargetMesaId).then(() => getMesas().then(m => {
        setMesas(m)
        setSelectedMesa(null)
        setShowMoveMesaModal(false)
        setMoveTargetMesaId(null)
        showNotification('success', 'Pedido movido exitosamente')
      }))
    }
  }

  const handlePaymentConfirm = () => {
    if (!paymentMethod || !selectedMesa) return
    closeMesa(selectedMesa.id!, paymentMethod).then(() => {
      getMesas().then(m => {
        setMesas(m)
        setSelectedMesa(null)
        setShowPaymentModal(false)
        setPaymentMethod('')
        loadTodayWow()
        showNotification('success', `Mesa cobrada: ${formatCOP(selectedMesa.total)} (${paymentMethod})`)
      })
    })
  }

  const handleCocinaCobrar = (mesa: Mesa) => {
    setSelectedMesa(mesa)
    setShowCocina(false)
  }

  const handleProductChange = (value: string) => {
    setMesaSelectedProduct(value)
    const found = products.find(p => p.name.toLowerCase() === value.toLowerCase())
    if (found) setMesaSelectedPrice(found.price)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🍽️ Mesas</h2>
          {!showCocina && (
            <p className="text-sm text-gray-500">
              {mesas.filter(m => m.status === 'disponible').length} libres · {mesas.filter(m => m.status === 'ocupada').length} ocupadas · {mesas.filter(m => m.status === 'cuenta').length} en cuenta
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => { setShowCocina(false); localStorage.setItem('lioncore_showCocina', 'false') }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!showCocina ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🍽️ Mesas
            </button>
            <button
              onClick={() => { setShowCocina(true); localStorage.setItem('lioncore_showCocina', 'true') }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${showCocina ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              👨‍🍳 Cocina
            </button>
          </div>
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">Tipo: {currentBusinessType}</span>
          {!showCocina && (
            <button
              onClick={() => { resetAllMesas().then(() => getMesas().then(setMesas)); setSelectedMesa(null); }}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200"
            >
              🔄 Reset Mesas
            </button>
          )}
          <button
            onClick={fetchServerInfo}
            className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-200"
          >
            📡 Conectar
          </button>
        </div>
      </div>

      {showServerInfo && (
        <ServerInfo serverInfo={serverInfo} onClose={() => setShowServerInfo(false)} />
      )}

      {showCocina ? (
        <CocinaView mesas={mesas} onCobrar={handleCocinaCobrar} onUpdateItemStatus={async (mesaId, itemIndex, status) => {
          await setOrderItemStatus(mesaId, itemIndex, status)
          getMesas().then(setMesas)
        }} />
      ) : !selectedMesa ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {mesas.map(mesa => (
            <MesaCard key={mesa.id} mesa={mesa} onClick={handleMesaClick} />
          ))}
        </div>
      ) : (
        <MesaDetail
          mesa={selectedMesa}
          onBack={() => setSelectedMesa(null)}
          onRemoveItem={handleRemoveItem}
          onAddProduct={() => setShowMesaProductSelect(true)}
          onCobrar={() => { setShowPaymentModal(true); setPaymentMethod('') }}
          onSolicitarCuenta={handleSolicitarCuenta}
          onWhatsApp={handleWhatsApp}
          onMover={() => { setMoveTargetMesaId(null); setShowMoveMesaModal(true) }}
        />
      )}

      <MesaProductModal
        show={showMesaProductSelect}
        mesaName={selectedMesa?.name || ''}
        products={products}
        selectedProduct={mesaSelectedProduct}
        quantity={mesaProductQty}
        price={mesaSelectedPrice}
        onProductChange={handleProductChange}
        onQtyChange={setMesaProductQty}
        onPriceChange={setMesaSelectedPrice}
        onAdd={handleAddProduct}
        onClose={() => { setShowMesaProductSelect(false); setMesaSelectedProduct(''); setMesaProductQty(1); setMesaSelectedPrice(0) }}
      />

      <MoveMesaModal
        show={showMoveMesaModal}
        selectedMesa={selectedMesa}
        mesas={mesas}
        targetMesaId={moveTargetMesaId}
        onSelectTarget={setMoveTargetMesaId}
        onConfirm={handleMoveConfirm}
        onClose={() => setShowMoveMesaModal(false)}
      />

      <PaymentModal
        show={showPaymentModal}
        mesaName={selectedMesa?.name || ''}
        total={selectedMesa?.total || 0}
        paymentMethod={paymentMethod}
        onSelectMethod={setPaymentMethod}
        onConfirm={handlePaymentConfirm}
        onClose={() => { setShowPaymentModal(false); setPaymentMethod('') }}
      />
    </div>
  )
}

export default RestaurantModule
