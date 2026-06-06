import { useState } from 'react'
import { quickCreateProduct, generateExpressCode, generateExpressName } from '../../services/db'

interface ExpressInventoryModalProps {
  show: boolean
  onClose: () => void
  businessId: number
  onComplete: () => void
  showNotification: (type: 'success' | 'error', message: string) => void
}

export default function ExpressInventoryModal({
  show,
  onClose,
  businessId,
  onComplete,
  showNotification,
}: ExpressInventoryModalProps) {
  const [categoria, setCategoria] = useState('')
  const [modelo, setModelo] = useState('')
  const [color, setColor] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [ubicacion, setUbicacion] = useState(() => localStorage.getItem('lioncore_express_ubicacion') || '')
  const [saving, setSaving] = useState(false)

  if (!show) return null

  const previewName = generateExpressName(categoria, modelo, color)
  const previewCode = generateExpressCode(categoria, modelo, color)

  const handleSave = async (createAnother: boolean) => {
    if (!categoria.trim() || !modelo.trim() || !color.trim()) {
      showNotification('error', 'Completa categoría, modelo y color')
      return
    }
    setSaving(true)
    try {
      await quickCreateProduct(
        businessId, categoria.trim(), modelo.trim(), color.trim(),
        Number(cantidad) || 1, ubicacion.trim() || undefined,
      )
      if (ubicacion) localStorage.setItem('lioncore_express_ubicacion', ubicacion)
      showNotification('success', `"${previewName}" guardado (${previewCode})`)
      if (createAnother) {
        setModelo('')
        setColor('')
        setCantidad('1')
      } else {
        onClose()
      }
      onComplete()
    } catch (e: any) {
      showNotification('error', 'Error al guardar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-center">
          <h2 className="text-xl font-bold text-white">⚡ Inventario Express</h2>
          <p className="text-emerald-100 text-sm mt-1">Registra productos en segundos</p>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-0.5">Categoría</label>
            <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)}
              placeholder="Ej: Forro" autoFocus
              list="express-categorias"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <datalist id="express-categorias" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-0.5">Modelo</label>
            <input type="text" value={modelo} onChange={e => setModelo(e.target.value)}
              placeholder="Ej: iPhone 15"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-0.5">Color</label>
            <input type="text" value={color} onChange={e => setColor(e.target.value)}
              placeholder="Ej: Negro"
              list="express-colores"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <datalist id="express-colores">
              <option value="Negro" /><option value="Blanco" /><option value="Azul" />
              <option value="Rojo" /><option value="Verde" /><option value="Gris" />
              <option value="Plateado" /><option value="Dorado" /><option value="Transparente" />
              <option value="Rosado" /><option value="Morado" /><option value="Café" />
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-0.5">Cantidad</label>
              <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)}
                min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-0.5">Ubicación</label>
              <input type="text" value={ubicacion} onChange={e => setUbicacion(e.target.value)}
                placeholder="Ej: Caja B"
                list="express-ubicaciones"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <datalist id="express-ubicaciones">
                <option value="Caja A" /><option value="Caja B" /><option value="Estante 1" />
                <option value="Estante 2" /><option value="Gaveta 1" /><option value="Gaveta 2" />
                <option value="Vitrina" /><option value="Bodega" />
              </datalist>
            </div>
          </div>

          {(categoria || modelo || color) && (
            <div className="p-2 bg-gray-50 rounded-lg text-xs">
              <p className="text-gray-500">Nombre: <span className="font-semibold text-gray-800">{previewName || '—'}</span></p>
              <p className="text-gray-500">Código: <span className="font-mono font-semibold text-emerald-600">{previewCode || '—'}</span></p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => handleSave(true)} disabled={saving}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-300 text-sm">
              {saving ? 'Guardando...' : '💾 Guardar y otro'}
            </button>
            <button onClick={() => handleSave(false)} disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 text-sm">
              ✅ Guardar y salir
            </button>
          </div>

          <button onClick={onClose}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
