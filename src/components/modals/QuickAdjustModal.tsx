interface QuickAdjustModalProps {
  show: boolean
  quickAdjustProduct: string
  quickAdjustQty: string
  quickAdjustType: '+' | '-'
  onQtyChange: (v: string) => void
  onTypeChange: (v: '+' | '-') => void
  onSave: () => void
  onClose: () => void
}

export default function QuickAdjustModal({
  quickAdjustProduct,
  quickAdjustQty,
  quickAdjustType,
  onQtyChange,
  onTypeChange,
  onSave,
  onClose,
}: QuickAdjustModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">🔧 Ajustar: {quickAdjustProduct}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => onTypeChange('+')}
              className={`flex-1 py-2 rounded-lg font-semibold ${quickAdjustType === '+' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              + Sumar
            </button>
            <button
              onClick={() => onTypeChange('-')}
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
              onChange={e => onQtyChange(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              onKeyDown={e => e.key === 'Enter' && onSave()}
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
            >
              Ajustar Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
