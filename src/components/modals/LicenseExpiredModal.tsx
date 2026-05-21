import { getDeviceId } from '../../services/license'

interface LicenseExpiredModalProps {
  onFreeMode: () => void
  onPay: () => void
}

export default function LicenseExpiredModal({ onFreeMode, onPay }: LicenseExpiredModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">Licencia Expirada</h2>
        <p className="text-gray-600 mb-6">Tu licencia ha expirado. Contacta soporte para renovar.</p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">Device ID</p>
          <p className="font-mono text-sm font-bold">{getDeviceId()}</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onFreeMode}
            className="py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
          >
            Modo FREE
          </button>
          <button
            onClick={onPay}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700"
          >
            💳 Pagar para renovar
          </button>
          <a
            href={`https://wa.me/573138777115?text=Hola!%20Mi%20licencia%20expir%C3%B3%20y%20necesito%20renovarla.%20Device%20ID:%20${getDeviceId()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600"
          >
            📱
          </a>
        </div>
      </div>
    </div>
  )
}
