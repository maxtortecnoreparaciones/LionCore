import { useState } from 'react'
import { createVariantProducts, generateExpressCode, generateExpressName } from '../../services/db'

interface VariantGeneratorModalProps {
  show: boolean
  onClose: () => void
  businessId: number
  onComplete: () => void
  showNotification: (type: 'success' | 'error', message: string) => void
}

export default function VariantGeneratorModal({
  show,
  onClose,
  businessId,
  onComplete,
  showNotification,
}: VariantGeneratorModalProps) {
  const [categoria, setCategoria] = useState('')
  const [modelosText, setModelosText] = useState('')
  const [coloresText, setColoresText] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [ubicacion, setUbicacion] = useState('')
  const [saving, setSaving] = useState(false)

  if (!show) return null

  const modelos = modelosText.split('\n').map(s => s.trim()).filter(Boolean)
  const colores = coloresText.split('\n').map(s => s.trim()).filter(Boolean)
  const total = modelos.length * colores.length

  const previews = total > 0 && total <= 6 ? (
    <div className="mt-1 space-y-0.5">
      {modelos.slice(0, 3).map(m =>
        colores.slice(0, 3).map(c => (
          <p key={m + c} className="text-[10px] text-gray-500">
            {generateExpressCode(categoria, m, c)} — {generateExpressName(categoria, m, c)}
          </p>
        ))
      ).flat().slice(0, 6)}
      {total > 6 && <p className="text-[10px] text-gray-400">...y {total - 6} más</p>}
    </div>
  ) : null

  const handleGenerate = async () => {
    if (!categoria.trim() || modelos.length === 0 || colores.length === 0) {
      showNotification('error', 'Completa categoría, modelos y colores')
      return
    }
    if (total > 200) {
      showNotification('error', `Demasiadas combinaciones (${total}). Máximo 200.`)
      return
    }
    setSaving(true)
    try {
      const created = await createVariantProducts(
        businessId, categoria.trim(), modelos, colores,
        Number(cantidad) || 1, ubicacion.trim() || undefined,
      )
      showNotification('success', `${created} productos generados exitosamente`)
      onComplete()
      onClose()
    } catch (e: any) {
      showNotification('error', 'Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-center">
          <h2 className="text-xl font-bold text-white">🧬 Generar Variantes</h2>
          <p className="text-purple-100 text-sm mt-1">Crea productos automáticamente desde una plantilla</p>
        </div>

        <div className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-0.5">Categoría / Producto base</label>
            <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)}
              placeholder="Ej: Forro" autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-0.5">Modelos (uno por línea)</label>
              <textarea value={modelosText} onChange={e => setModelosText(e.target.value)}
                placeholder={`13\n14\n15\n15 Pro`}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              {modelos.length > 0 && (
                <p className="text-[10px] text-gray-400 mt-0.5">{modelos.length} modelo(s)</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-0.5">Colores (uno por línea)</label>
              <textarea value={coloresText} onChange={e => setColoresText(e.target.value)}
                placeholder={`Negro\nAzul\nTransparente`}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              {colores.length > 0 && (
                <p className="text-[10px] text-gray-400 mt-0.5">{colores.length} color(es)</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-0.5">Cantidad por variante</label>
              <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)}
                min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-0.5">Ubicación</label>
              <input type="text" value={ubicacion} onChange={e => setUbicacion(e.target.value)}
                placeholder="Ej: Caja B"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          {total > 0 && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm font-semibold text-purple-700">
                {total} producto(s) a generar
              </p>
              {previews}
            </div>
          )}

          <button onClick={handleGenerate} disabled={saving || total === 0}
            className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 text-sm">
            {saving ? 'Generando...' : `🧬 Generar ${total} producto(s)`}
          </button>

          <button onClick={onClose}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
