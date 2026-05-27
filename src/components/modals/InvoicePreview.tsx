import { formatCOP } from '../../utils/format'

type Mode = 'venta' | 'compra' | 'gasto' | 'produccion'

interface Item {
  id: number
  producto: string
  code?: string
  unit?: string
  cantidad: number
  precio: number
}

interface InvoicePreviewProps {
  mode: Mode
  items: Item[]
  total: number
  onClose: () => void
}

export default function InvoicePreview({ mode, items, total, onClose }: InvoicePreviewProps) {
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
                    <td className="py-2">
                      {item.code && <span className="text-[10px] font-mono text-gray-400 block">[{item.code}]</span>}
                      <span>{item.producto}</span>
                    </td>
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
