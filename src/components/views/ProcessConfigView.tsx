import { useState, useEffect } from 'react'
import { ProductionProcess, getProductionProcesses, createProductionProcess, updateProductionProcess, deleteProductionProcess, reorderProductionProcesses } from '../../services/db'

interface ProcessConfigViewProps {
  show: boolean
}

export default function ProcessConfigView({ show }: ProcessConfigViewProps) {
  const [processes, setProcesses] = useState<ProductionProcess[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<'produccion' | 'calidad' | 'empaque' | 'otro'>('produccion')
  const [requiresTime, setRequiresTime] = useState(true)
  const [requiresWeight, setRequiresWeight] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (show) load() }, [show])

  const load = async () => {
    setLoading(true)
    const data = await getProductionProcesses()
    setProcesses(data)
    setLoading(false)
  }

  if (!show) return null

  const resetForm = () => {
    setName('')
    setType('produccion')
    setRequiresTime(true)
    setRequiresWeight(false)
    setEditingId(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    if (editingId) {
      await updateProductionProcess(editingId, { name: name.trim(), type, requiresTime, requiresWeight })
    } else {
      await createProductionProcess({ name: name.trim(), type, requiresTime, requiresWeight, active: true })
    }
    resetForm()
    load()
  }

  const handleEdit = (p: ProductionProcess) => {
    setName(p.name)
    setType(p.type)
    setRequiresTime(p.requiresTime)
    setRequiresWeight(p.requiresWeight)
    setEditingId(p.id!)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este proceso?')) return
    await deleteProductionProcess(id)
    load()
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const ids = processes.map(p => p.id!)
    ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
    await reorderProductionProcesses(ids)
    load()
  }

  const handleMoveDown = async (index: number) => {
    if (index === processes.length - 1) return
    const ids = processes.map(p => p.id!)
    ;[ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]
    await reorderProductionProcesses(ids)
    load()
  }

  const handleToggleActive = async (p: ProductionProcess) => {
    await updateProductionProcess(p.id!, { active: !p.active })
    load()
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">⚙️ Procesos</h2>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700">+ Nuevo</button>
      </div>

      <div className="p-4">
        {showForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3 border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del proceso</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Lavado" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="produccion">Producción</option>
                  <option value="calidad">Calidad</option>
                  <option value="empaque">Empaque</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="space-y-2 pt-5">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={requiresTime} onChange={e => setRequiresTime(e.target.checked)} className="rounded" />
                  Requiere tiempo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={requiresWeight} onChange={e => setRequiresWeight(e.target.checked)} className="rounded" />
                  Requiere peso
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700">{editingId ? 'Guardar' : 'Crear'}</button>
              <button onClick={resetForm} className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-8">Cargando...</p>
        ) : processes.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay procesos. Crea el primero.</p>
        ) : (
          <div className="space-y-2">
            {processes.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border ${p.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleMoveUp(i)} disabled={i === 0} className="text-[10px] text-gray-400 hover:text-gray-700 disabled:opacity-30">▲</button>
                  <button onClick={() => handleMoveDown(i)} disabled={i === processes.length - 1} className="text-[10px] text-gray-400 hover:text-gray-700 disabled:opacity-30">▼</button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-800">{p.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{p.type}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {p.requiresTime && <span className="mr-2">⏱ tiempo</span>}
                    {p.requiresWeight && <span>⚖️ peso</span>}
                  </div>
                </div>
                <button onClick={() => handleToggleActive(p)} className={`text-[10px] px-2 py-1 rounded font-semibold ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                  {p.active ? 'Activo' : 'Inactivo'}
                </button>
                <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700 text-xs">✏️</button>
                <button onClick={() => handleDelete(p.id!)} className="text-red-400 hover:text-red-600 text-xs">🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
