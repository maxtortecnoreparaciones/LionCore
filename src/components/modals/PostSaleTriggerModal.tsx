interface PostSaleTriggerModalProps {
  show: boolean
  isActivated: boolean
  onActivate: () => void
  onViewSummary: () => void
  onClose: () => void
}

export default function PostSaleTriggerModal({
  isActivated,
  onActivate,
  onViewSummary,
  onClose,
}: PostSaleTriggerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Venta registrada</h3>
        <p className="text-gray-600 text-sm mb-4">¿Sabes cuanto ganaste realmente?</p>
        {!isActivated ? (
          <div>
            <p className="text-xs text-gray-500 mb-3">Activa PRO para ver tu ganancia neta</p>
            <div className="flex gap-2">
              <button
                onClick={onActivate}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-sm"
              >
                Activar PRO
              </button>
              <button
                onClick={onClose}
                className="py-2 px-4 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onViewSummary}
            className="py-2 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Ver en Resumen
          </button>
        )}
      </div>
    </div>
  )
}
