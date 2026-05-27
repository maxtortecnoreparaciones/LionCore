import { Product } from '../../services/db'
import { formatCOP } from '../../utils/format'

interface MesaProductModalProps {
  show: boolean
  mesaName: string
  products: Product[]
  selectedProduct: string
  quantity: number
  price: number
  onProductChange: (v: string) => void
  onQtyChange: (v: number) => void
  onPriceChange: (v: number) => void
  onAdd: () => void
  onClose: () => void
}

const MesaProductModal: React.FC<MesaProductModalProps> = ({ show, mesaName, products, selectedProduct, quantity, price, onProductChange, onQtyChange, onPriceChange, onAdd, onClose }) => {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors font-bold text-lg"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Agregar a {mesaName}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
            <input
              type="text"
              value={selectedProduct}
              onChange={(e) => onProductChange(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedProduct && (
              <div className="mt-1 max-h-32 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                {products.filter(p => { const q = selectedProduct.toLowerCase(); return p.name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q)) || (p.qr && p.qr.toLowerCase().includes(q)) }).slice(0, 6).map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onProductChange(p.name); onPriceChange(p.price) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium">{p.code ? <span className="text-[10px] font-mono bg-blue-50 text-blue-600 rounded px-0.5 mr-1">{p.code}</span> : ''}{p.name}</span>
                    <span className="text-gray-500 ml-2">{formatCOP(p.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => onQtyChange(Number(e.target.value))}
                min="1"
                className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Precio</label>
              <input
                type="number"
                value={price}
                onChange={(e) => onPriceChange(Number(e.target.value))}
                placeholder="0"
                className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={onAdd}
            disabled={!selectedProduct || price <= 0}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

export default MesaProductModal
