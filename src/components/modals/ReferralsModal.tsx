interface ReferralsModalProps {
  show: boolean
  onClose: () => void
  onCopy?: () => void
}

export default function ReferralsModal({
  onClose,
  onCopy,
}: ReferralsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="text-5xl mb-3">🎁</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Invita y gana</h2>
        <p className="text-gray-600 mb-4">Invita a un amigo y gana $10.000 en credito</p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-500 mb-2">Tu mensaje de invitacion:</p>
          <p className="text-sm font-mono bg-white p-3 rounded border text-left">
            Hola! Te recomiendo LionCore, el mejor POS para tu negocio. Registrate aqui 👇
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              const msg = encodeURIComponent('Hola! Te recomiendo LionCore, el mejor POS para tu negocio. Registrate aqui!')
              window.open(`https://wa.me/573138777115?text=${msg}`, '_blank')
              onClose()
            }}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <span>📱</span> Enviar por WhatsApp
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText('https://lioncore.app/ref')
              onCopy?.()
            }}
            className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
          >
            📋 Copiar link
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-3 text-sm text-gray-500 hover:text-gray-700"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
