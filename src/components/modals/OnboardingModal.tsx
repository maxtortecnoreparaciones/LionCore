import { useState } from 'react'
import { BusinessType, businessTemplates, db } from '../../services/db'

interface OnboardingModalProps {
  show: boolean
  currentBusinessId: number
  newBusinessName: string
  newProductName: string
  newProductPrice: string
  onBusinessNameChange: (v: string) => void
  onProductNameChange: (v: string) => void
  onProductPriceChange: (v: string) => void
  onCreateBusiness: (name: string, tipo: BusinessType) => void
  onComplete: () => void
  showNotification: (type: 'success' | 'error', message: string) => void
}

export default function OnboardingModal({
  currentBusinessId,
  newBusinessName,
  newProductName,
  newProductPrice,
  onBusinessNameChange,
  onProductNameChange,
  onProductPriceChange,
  onCreateBusiness,
  onComplete,
  showNotification,
}: OnboardingModalProps) {
  const [step, setStep] = useState(1)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center">
          <div className="text-5xl mb-3">
            {step === 1 ? '🦁' : step === 2 ? '🏪' : '📦'}
          </div>
          <h2 className="text-2xl font-bold text-white">
            {step === 1 ? 'Bienvenido a LionCore' : step === 2 ? 'Tu Negocio' : 'Tu Primer Producto'}
          </h2>
        </div>

        <div className="p-6">
          <div className="flex justify-center gap-1 mb-6">
            {[1,2,3].map(s => (
              <div key={s} className={`h-2 w-8 rounded-full ${
                s <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            ))}
          </div>

          {step === 1 && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                El POS inteligente que funciona <strong>sin internet</strong> y se adapta a tu negocio.
              </p>
              <ul className="text-left space-y-2 text-sm text-gray-600">
                <li>✅ Vende productos y servicios</li>
                <li>📦 Controla tu inventario</li>
                <li>🔧 Servicios técnicos con CRM</li>
                <li>📊 Reportes de ganancias</li>
                <li>📱 Funciona en redes WiFi locales</li>
              </ul>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Elige el tipo de negocio que mejor se adapte a ti:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(businessTemplates) as BusinessType[]).map(tipo => {
                  const tpl = businessTemplates[tipo]
                  return (
                    <button
                      key={tipo}
                      onClick={() => {
                        if (newBusinessName) {
                          onCreateBusiness(newBusinessName, tipo)
                        }
                      }}
                      className="p-3 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                    >
                      <span className="text-3xl">{tpl.emoji}</span>
                      <p className="text-sm font-semibold mt-1">{tpl.label}</p>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Nombre de tu negocio"
                  value={newBusinessName}
                  onChange={e => onBusinessNameChange(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Agrega tu primer producto para empezar a vender:
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={newProductName}
                  onChange={e => onProductNameChange(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Precio de venta"
                  value={newProductPrice}
                  onChange={e => onProductPriceChange(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onComplete}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
          >
            Saltar
          </button>
          <button
            onClick={async () => {
              if (step === 3) {
                if (newProductName && newProductPrice) {
                  await db.products.add({
                    businessId: currentBusinessId,
                    name: newProductName,
                    price: Number(newProductPrice),
                    createdAt: new Date(),
                  })
                  showNotification('success', 'Producto creado!')
                }
                onComplete()
              } else {
                setStep(s => s + 1)
              }
            }}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
          >
            {step === 3 ? 'Comenzar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}
