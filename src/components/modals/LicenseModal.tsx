interface LicenseModalProps {
  show: boolean
  email: string
  status: { success: boolean; message: string } | null
  debug: any
  onEmailChange: (v: string) => void
  onActivate: () => void
  onClose: () => void
  onShowPayment: () => void
  onFetchSheetData: () => void
}

export default function LicenseModal({
  email,
  status,
  debug,
  onEmailChange,
  onActivate,
  onClose,
  onShowPayment,
  onFetchSheetData,
}: LicenseModalProps) {
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
          <div className="text-4xl mb-2">🔑</div>
          <h2 className="text-2xl font-bold text-gray-800">Activar Licencia</h2>
          <p className="text-sm text-gray-500 mt-1">Ingresa tu email para validar la licencia</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { onEmailChange(e.target.value); }}
              placeholder="tu@email.com"
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && onActivate()}
            />
          </div>
          
          {status && (
            <div className={`p-3 rounded-lg text-sm ${status.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {status.message}
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onActivate}
              disabled={!email}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Activar
            </button>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Planes disponibles:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">Free</span>
              <span className="text-gray-500">Ventas + Exportar</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
              <span className="font-medium text-purple-600">Pro</span>
              <span className="text-purple-600">Todas las funciones</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={onShowPayment}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 shadow-lg flex items-center justify-center gap-2"
          >
            💳 Pagar aquí
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={onFetchSheetData}
            className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
          >
            🔍 Ver datos del Sheet
          </button>
          {debug && (
            <pre className="mt-2 p-2 bg-gray-900 text-green-400 rounded-lg text-xs overflow-auto max-h-48 font-mono whitespace-pre-wrap">
              {debug}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
