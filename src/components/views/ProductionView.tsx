interface ProductionDashboardData {
  totalProduced: number
  totalWaste: number
  avgRendimiento: number
  totalBatches: number
}

interface RawMaterialItem {
  id?: number
  name: string
  stock?: number
  code?: string
  unidad?: string
}

interface FinalProductItem {
  id?: number
  name: string
  stock?: number
  code?: string
  unidad?: string
}

interface ProductionRecord {
  id?: number
  loteId: string
  rawMaterialName: string
  finalProductName: string
  rawMaterialQty: number
  finalProductQty: number
  rendimiento: number
  wasteQty: number
  costoUnitario: number
  date: Date
}

interface ProductionViewProps {
  show: boolean
  productionDashboard: ProductionDashboardData | null
  defaultUnit: string
  rawMaterial: string
  onRawMaterialChange: (v: string) => void
  rawMaterials: RawMaterialItem[]
  finalProduct: string
  onFinalProductChange: (v: string) => void
  finalProducts: FinalProductItem[]
  rawQty: string
  onRawQtyChange: (v: string) => void
  finalQty: string
  onFinalQtyChange: (v: string) => void
  notes: string
  onNotesChange: (v: string) => void
  calcRendimiento: number
  onRegister: () => void
  productions: ProductionRecord[]
}

export default function ProductionView({
  show,
  productionDashboard,
  defaultUnit,
  rawMaterial,
  onRawMaterialChange,
  rawMaterials,
  finalProduct,
  onFinalProductChange,
  finalProducts,
  rawQty,
  onRawQtyChange,
  finalQty,
  onFinalQtyChange,
  notes,
  onNotesChange,
  calcRendimiento,
  onRegister,
  productions,
}: ProductionViewProps) {
  if (!show) return null

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">🏭 Produccion</h2>
        <p className="text-sm text-gray-500">Convierte materia prima en producto final</p>
      </div>

      {productionDashboard && (
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-600 font-semibold">Producido Total</p>
            <p className="text-lg font-bold text-green-700">{productionDashboard.totalProduced} {defaultUnit}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-xs text-red-600 font-semibold">Merma Total</p>
            <p className="text-lg font-bold text-red-700">{productionDashboard.totalWaste} {defaultUnit}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-600 font-semibold">Rendimiento Prom.</p>
            <p className="text-lg font-bold text-blue-700">{productionDashboard.avgRendimiento.toFixed(1)}%</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-xs text-purple-600 font-semibold">Lotes</p>
            <p className="text-lg font-bold text-purple-700">{productionDashboard.totalBatches}</p>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-200">
        <h3 className="font-bold text-gray-800 mb-3">🔄 Nueva Produccion</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materia Prima</label>
            <select
              value={rawMaterial}
              onChange={e => onRawMaterialChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar...</option>
              {rawMaterials.map(p => (
                <option key={p.id} value={p.name}>{p.code ? `[${p.code}] ` : ''}{p.name} (Stock: {p.stock || 0} {p.unidad || defaultUnit})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto Final</label>
            <select
              value={finalProduct}
              onChange={e => onFinalProductChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar...</option>
              {finalProducts.map(p => (
                <option key={p.id} value={p.name}>{p.code ? `[${p.code}] ` : ''}{p.name} (Stock: {p.stock || 0} {p.unidad || defaultUnit})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Materia Prima ({defaultUnit})</label>
            <input
              type="number"
              value={rawQty}
              onChange={e => onRawQtyChange(e.target.value)}
              placeholder="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto Final Obtenido ({defaultUnit})</label>
            <input
              type="number"
              value={finalQty}
              onChange={e => onFinalQtyChange(e.target.value)}
              placeholder="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              placeholder="Tiempo, temperatura, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {Number(rawQty) > 0 && Number(finalQty) > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Rendimiento:</span>
              <span className={`font-bold ${calcRendimiento < 30 ? 'text-red-600' : 'text-green-600'}`}>
                {calcRendimiento}%
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Merma:</span>
              <span className="text-red-500 font-semibold">{(Number(rawQty) - Number(finalQty)).toFixed(1)} {defaultUnit}</span>
            </div>
            {calcRendimiento < 30 && (
              <p className="text-xs text-red-500 mt-2">⚠️ Estas perdiendo producto y no lo sabes</p>
            )}
          </div>
        )}

        <button
          onClick={onRegister}
          disabled={!rawMaterial || !finalProduct || !rawQty || !finalQty}
          className="w-full mt-4 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          🏭 Registrar Produccion
        </button>
      </div>

      {productions.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3">📋 Historial de Lotes</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {productions.slice(0, 20).map(prod => (
              <div key={prod.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{prod.loteId}</p>
                    <p className="text-xs text-gray-500">
                      {prod.rawMaterialName} → {prod.finalProductName}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${prod.rendimiento >= 30 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {prod.rendimiento.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{prod.rawMaterialQty} {defaultUnit} → {prod.finalProductQty} {defaultUnit}</span>
                  <span>Merma: {prod.wasteQty.toFixed(1)} {defaultUnit}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(prod.date).toLocaleDateString()} - Costo: ${prod.costoUnitario.toFixed(0)}/{defaultUnit}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
