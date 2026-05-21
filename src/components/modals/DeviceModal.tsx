interface DeviceModalProps {
  show: boolean
  deviceId: string
  licenseState: {
    isActivated: boolean
    email: string
    plan: string
  }
  licenseStatusCheck: {
    daysLeft: number
    isExpired: boolean
  }
  onClose: () => void
  onDeactivate: () => void
}

export default function DeviceModal({
  deviceId,
  licenseState,
  licenseStatusCheck,
  onClose,
  onDeactivate,
}: DeviceModalProps) {
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
          <div className="text-4xl mb-2">💻</div>
          <h2 className="text-2xl font-bold text-gray-800">Info del Dispositivo</h2>
        </div>
        
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Device ID</p>
            <p className="font-mono text-sm font-bold text-gray-800 break-all">{deviceId}</p>
          </div>
          {licenseState.isActivated && (
            <>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-semibold text-gray-800">{licenseState.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Plan</p>
                <p className={`text-sm font-bold ${licenseState.plan === 'pro' ? 'text-purple-600' : licenseState.plan === 'enterprise' ? 'text-yellow-600' : 'text-gray-600'}`}>
                  {licenseState.plan.toUpperCase()}
                </p>
              </div>
              {licenseStatusCheck.daysLeft >= 0 && (
                <div className={`rounded-lg p-3 ${licenseStatusCheck.daysLeft <= 7 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50'}`}>
                  <p className="text-xs text-gray-500">Días restantes</p>
                  <p className={`text-lg font-bold ${licenseStatusCheck.daysLeft <= 7 ? 'text-amber-600' : 'text-green-600'}`}>
                    {licenseStatusCheck.daysLeft} días
                  </p>
                </div>
              )}
              {licenseStatusCheck.isExpired && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-bold text-red-600">⚠️ Licencia expirada</p>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cerrar
          </button>
          {licenseState.isActivated && (
            <button
              onClick={onDeactivate}
              className="py-3 px-4 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
            >
              Desactivar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
