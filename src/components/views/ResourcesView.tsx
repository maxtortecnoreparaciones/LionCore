import { useState, useEffect } from 'react'
import { ProductionResource, RESOURCE_TYPES, getResources, createResource, updateResource, deactivateResource } from '../../services/db'

interface ResourcesViewProps {
  show: boolean
}

function ResourceIcon(type: string): string {
  const icons: Record<string, string> = { HORNO: '🔥', OPERARIO: '👤', AREA: '📍', MESA: '🪑', OTRO: '📦' }
  return icons[type] || '📦'
}

export default function ResourcesView({ show }: ResourcesViewProps) {
  const [resources, setResources] = useState<ProductionResource[]>([])
  const [filterType, setFilterType] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<typeof RESOURCE_TYPES[number]>('OTRO')
  const [capacity, setCapacity] = useState('')
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (show) load() }, [show])

  const load = async () => {
    setLoading(true)
    const data = filterType ? await getResources(filterType as any) : await getResources()
    setResources(data)
    setLoading(false)
  }

  useEffect(() => { if (show) load() }, [filterType, show])

  if (!show) return null

  const resetForm = () => {
    setName('')
    setType('OTRO')
    setCapacity('')
    setNotas('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    if (editingId) {
      await updateResource(editingId, {
        name: name.trim(),
        type: type as any,
        capacity: capacity ? Number(capacity) : undefined,
        notas: notas.trim() || undefined,
      })
    } else {
      await createResource({
        name: name.trim(),
        type: type as any,
        capacity: capacity ? Number(capacity) : undefined,
        estado: 'activo',
        notas: notas.trim() || undefined,
      })
    }
    resetForm()
    load()
  }

  const handleEdit = (r: ProductionResource) => {
    setName(r.name)
    setType(r.type as any)
    setCapacity(r.capacity ? String(r.capacity) : '')
    setNotas(r.notas || '')
    setEditingId(r.id!)
    setShowForm(true)
  }

  const handleDeactivate = async (id: number) => {
    if (!confirm('¿Desactivar este recurso?')) return
    await deactivateResource(id)
    load()
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">🔧 Recursos</h2>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700">+ Nuevo</button>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${!filterType ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Todos</button>
          {RESOURCE_TYPES.map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filterType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {ResourceIcon(t)} {t}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3 border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Horno Industrial 1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {RESOURCE_TYPES.map(t => <option key={t} value={t}>{ResourceIcon(t)} {t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Capacidad</label>
                <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Opcional" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                <input type="text" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Opcional" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
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
        ) : resources.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay recursos{filterType ? ` de tipo ${filterType}` : ''}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {resources.map(r => (
              <div key={r.id} className={`border rounded-lg p-3 ${r.estado === 'inactivo' ? 'opacity-50 bg-gray-50' : 'bg-white'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span>{ResourceIcon(r.type)}</span>
                      <span className="font-semibold text-sm text-gray-800">{r.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 mt-1 inline-block">{r.type}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(r)} className="text-blue-500 hover:text-blue-700 text-xs">✏️</button>
                    {r.estado === 'activo' && (
                      <button onClick={() => handleDeactivate(r.id!)} className="text-red-400 hover:text-red-600 text-xs">🚫</button>
                    )}
                  </div>
                </div>
                {r.capacity && <p className="text-xs text-gray-500 mt-1">Capacidad: {r.capacity}</p>}
                {r.notas && <p className="text-[10px] text-gray-400 mt-0.5">📝 {r.notas}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
