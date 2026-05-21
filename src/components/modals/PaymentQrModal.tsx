interface PaymentQrModalProps {
  show: boolean
  onClose: () => void
  onCashPayment: () => void
}

export default function PaymentQrModal({
  onClose,
  onCashPayment,
}: PaymentQrModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-gray-800 transition-colors font-bold text-lg shadow-md"
        >
          ✕
        </button>
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-center">
          <h2 className="text-xl font-bold text-white">💳 Pagar para Activar</h2>
          <p className="text-green-100 text-sm mt-1">Realiza el pago y activa tu licencia PRO</p>
        </div>
        
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-4 mb-4 flex flex-col items-center">
            <a href="./QR.jpeg" target="_blank" rel="noopener noreferrer" className="block">
              <img src="./QR.jpeg" alt="QR de Pago" className="w-56 h-56 object-contain hover:scale-105 transition-transform cursor-pointer" />
            </a>
            <p className="text-xs text-gray-400 mt-2">Toca la imagen para ver en grande</p>
          </div>

          <a
            href="https://wa.me/573138777115?text=Hola!%20Acabo%20de%20pagar%20mi%20licencia%20de%20LionCore%20POS.%20Env%C3%ADo%20comprobante%20de%20pago."
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-green-500 border-2 border-green-600 rounded-xl p-4 mb-4 cursor-pointer hover:bg-green-600 hover:shadow-lg transition-all text-center"
          >
            <p className="text-white font-bold text-lg mb-1">📸 Enviar comprobante de pago</p>
            <p className="text-green-100 text-sm">Toca aquí para abrir WhatsApp</p>
            <p className="text-white font-bold mt-1">313 877 7115</p>
          </a>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-xs text-gray-400 font-medium">O PAGA EN</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>
            <button
              onClick={onCashPayment}
              className="w-full bg-yellow-400 border-2 border-yellow-500 rounded-xl p-4 cursor-pointer hover:bg-yellow-500 hover:shadow-lg transition-all text-center"
            >
              <span className="text-2xl">💵</span>
              <p className="text-gray-800 font-bold text-lg mt-1">Efectivo</p>
              <p className="text-gray-600 text-sm">Pagaste en persona al administrador</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
