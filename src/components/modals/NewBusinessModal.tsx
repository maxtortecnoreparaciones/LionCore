import { BusinessType, businessTemplates } from '../../services/db'

interface NewBusinessModalProps {
  show: boolean
  newBusinessName: string
  newBusinessType: BusinessType
  onNameChange: (v: string) => void
  onTypeChange: (v: BusinessType) => void
  onCreate: () => void
  onClose: () => void
}

export default function NewBusinessModal({
  newBusinessName,
  newBusinessType,
  onNameChange,
  onTypeChange,
  onCreate,
  onClose,
}: NewBusinessModalProps) {
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
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ej: Mi Restaurante"
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newBusinessName) {
                  onCreate()
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
                    onClick={() => onTypeChange(tipo)}
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
            onClick={onCreate}
            disabled={!newBusinessName}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Crear Negocio
          </button>
        </div>
      </div>
    </div>
  )
}
