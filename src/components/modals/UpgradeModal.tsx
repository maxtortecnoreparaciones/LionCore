interface UpgradeModalProps {
  show: { title: string; message: string } | null
  onClose: () => void
  onPay: () => void
}

export default function UpgradeModal({
  show,
  onClose,
  onPay,
}: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors font-bold text-lg"
        >
          ✕
        </button>
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🚀</div>
          <h2 className="text-xl font-bold text-gray-800">{show?.title}</h2>
          <p className="text-sm text-gray-500 mt-2">{show?.message}</p>
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
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
          >
            Ahora no
          </button>
          <button
            onClick={onPay}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 shadow-lg"
          >
            💳 Pagar aquí
          </button>
        </div>
      </div>
    </div>
  )
}
