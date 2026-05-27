import { Business, BusinessType, businessTemplates, InventoryConfig } from '../../services/db'

interface ConfigViewProps {
  show: boolean
  businesses: Business[]
  currentBusinessId: number
  currentTpl: typeof businessTemplates.pos
  onSwitchBusiness: (id: number) => void
  onDeleteBusiness: (id: number) => Promise<void>
  onUpdateBusinessType: (id: number, tipo: BusinessType) => Promise<void>
  onNewBusiness: () => void
  invConfig: InventoryConfig
  onToggleSellWithoutStock: () => void
  onToggleLowStockAlert: () => void
  onLowStockThresholdChange: (v: number) => void
  onAllowNegativeChange: (v: boolean) => void
  onOpenInvAdjust: () => void
  showInventorySection: boolean
  businessConfig: {
    costoManoObra: string
    costoEnergia: string
    costoEmpaque: string
    costoTransporte: string
    porcentajeGanancia: string
  }
  onConfigFieldChange: (field: string, value: string) => void
  configSaved: boolean
  onSaveConfig: () => void
}

export function ConfigView(props: ConfigViewProps) {
  const {
    show,
    businesses,
    currentBusinessId,
    currentTpl,
    onSwitchBusiness,
    onDeleteBusiness,
    onUpdateBusinessType,
    onNewBusiness,
    invConfig,
    onToggleSellWithoutStock,
    onToggleLowStockAlert,
    onLowStockThresholdChange,
    onAllowNegativeChange,
    onOpenInvAdjust,
    showInventorySection,
    businessConfig,
    onConfigFieldChange,
    configSaved,
    onSaveConfig,
  } = props

  return (
    <>
      {show && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ Configuración</h2>

          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-700 mb-3">🏢 Negocios</h3>
            <div className="space-y-2 mb-3">
              {businesses.map(b => {
                const tpl = businessTemplates[b.tipo || 'pos']
                const isActive = b.id === currentBusinessId
                return (
                  <div
                    key={b.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="flex items-center gap-2 cursor-pointer flex-1"
                        onClick={() => { onSwitchBusiness(b.id!); window.location.reload() }}
                      >
                        <span className="text-xl">{tpl.emoji}</span>
                        <div>
                          <p className="font-semibold text-sm">{b.name}</p>
                          <p className="text-xs text-gray-500">{tpl.label} • {tpl.unidad}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Activo</span>}
                        {businesses.length > 1 && (
                          <button
                            onClick={() => { if (confirm(`¿Eliminar "${b.name}"?`)) { onDeleteBusiness(b.id!).then(() => window.location.reload()) } }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    {isActive && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Cambiar tipo de negocio:</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {(Object.keys(businessTemplates) as BusinessType[]).map(tipo => {
                            const t = businessTemplates[tipo]
                            const isSelected = b.tipo === tipo
                            return (
                              <button
                                key={tipo}
                                onClick={() => { onUpdateBusinessType(b.id!, tipo).then(() => window.location.reload()) }}
                                className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                                  isSelected ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {t.emoji} {t.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <button onClick={onNewBusiness} className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm">
              + Nuevo Negocio
            </button>
          </div>

          {showInventorySection && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700">📦 Inventario</h3>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">{currentTpl.label}</span>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer">
                  <div>
                    <p className="font-semibold text-sm">Permitir vender sin stock</p>
                    <p className="text-xs text-gray-500">No bloquear ventas si el inventario está en 0</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all ${invConfig.sellWithoutStock ? 'bg-green-500' : 'bg-gray-300'}`} onClick={onToggleSellWithoutStock}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all mt-0.5 ${invConfig.sellWithoutStock ? 'ml-6' : 'ml-0.5'}`} />
                  </div>
                </label>
                <label className="flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer">
                  <div>
                    <p className="font-semibold text-sm">Alerta de stock bajo</p>
                    <p className="text-xs text-gray-500">Avisar cuando un producto tenga poco stock</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all ${invConfig.lowStockAlert ? 'bg-green-500' : 'bg-gray-300'}`} onClick={onToggleLowStockAlert}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all mt-0.5 ${invConfig.lowStockAlert ? 'ml-6' : 'ml-0.5'}`} />
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mínimo para alerta</label>
                    <input type="number" value={invConfig.lowStockThreshold} onChange={(e) => onLowStockThresholdChange(Number(e.target.value))} min="1" className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Permitir negativo</label>
                    <select value={invConfig.allowNegative ? 'true' : 'false'} onChange={(e) => onAllowNegativeChange(e.target.value === 'true')} className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
                <button onClick={onOpenInvAdjust} className="w-full py-2 px-4 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 text-sm">
                  ✏️ Ajustar inventario manual
                </button>
              </div>
            </div>
          )}

          <h3 className="font-bold text-gray-800 mb-3">Configuración de Costos</h3>
          <p className="text-sm text-gray-500 mb-4">Configura los costos fijos para calcular el precio de venta en producción.</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Costo mano obra (por {currentTpl.unidad})</label>
              <input type="number" placeholder="0" value={businessConfig.costoManoObra} onChange={(e) => onConfigFieldChange('costoManoObra', e.target.value)} className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Costo energía</label>
              <input type="number" placeholder="0" value={businessConfig.costoEnergia} onChange={(e) => onConfigFieldChange('costoEnergia', e.target.value)} className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Costo empaque</label>
              <input type="number" placeholder="0" value={businessConfig.costoEmpaque} onChange={(e) => onConfigFieldChange('costoEmpaque', e.target.value)} className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Costo transporte</label>
              <input type="number" placeholder="0" value={businessConfig.costoTransporte} onChange={(e) => onConfigFieldChange('costoTransporte', e.target.value)} className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">% Ganancia</label>
              <input type="number" placeholder="30" value={businessConfig.porcentajeGanancia} onChange={(e) => onConfigFieldChange('porcentajeGanancia', e.target.value)} className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <button onClick={onSaveConfig} className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            {configSaved ? '✓ Guardado' : 'Guardar Configuración'}
          </button>
        </div>
      )}
    </>
  )
}
