import { useState, useEffect } from 'react'
import { Category, getCategoryTree, createCategory, updateCategory, deleteCategory } from '../../services/db'

interface CategoriesViewProps {
  show: boolean
}

export default function CategoriesView({ show }: CategoriesViewProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')
  const [newParentId, setNewParentId] = useState<number | undefined>(undefined)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => { if (show) load() }, [show])

  const load = async () => {
    const data = await getCategoryTree()
    setCategories(data)
  }

  if (!show) return null

  const handleCreate = async () => {
    if (!newName.trim()) return
    await createCategory(newName.trim(), newParentId)
    setNewName('')
    setNewParentId(undefined)
    load()
  }

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return
    await updateCategory(id, { name: editName.trim() })
    setEditingId(null)
    load()
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta categoría? Los productos asignados perderán la categoría.')) {
      await deleteCategory(id)
      load()
    }
  }

  const topLevel = categories.filter(c => !c.parentId)
  const filtered = filter ? categories.filter(c => c.name.toLowerCase().includes(filter.toLowerCase())) : categories
  const filteredIds = new Set(filtered.map(c => c.id))
  const filteredTopLevel = filter ? categories.filter(c => !c.parentId && filteredIds.has(c.id)) : topLevel

  const getChildren = (parentId: number) => {
    const children = categories.filter(c => c.parentId === parentId)
    if (filter) return children.filter(c => filteredIds.has(c.id))
    return children
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">📂 Categorías</h2>
      </div>

      <div className="p-4">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filtrar categorías..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
        />

        <div className="bg-gray-50 rounded-lg p-3 mb-4 flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Nueva categoría</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nombre"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-700 mb-1">Subcategoría de</label>
            <select
              value={newParentId || ''}
              onChange={e => setNewParentId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">(ninguna - categoría principal)</option>
              {topLevel.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleCreate} className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shrink-0">+</button>
        </div>

        {filteredTopLevel.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay categorías. Crea la primera.</p>
        ) : (
          <div className="space-y-1">
            {filteredTopLevel.map(cat => (
              <div key={cat.id}>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span className="text-sm font-semibold text-gray-700 flex-1">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id!)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                        autoFocus
                      />
                    ) : (
                      <span onDoubleClick={() => { setEditingId(cat.id!); setEditName(cat.name) }}>{cat.name}</span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400">{getChildren(cat.id!).length} subcategorías</span>
                  {editingId === cat.id ? (
                    <>
                      <button onClick={() => handleUpdate(cat.id!)} className="text-xs text-green-600 hover:text-green-800">💾</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                    </>
                  ) : (
                    <button onClick={() => handleDelete(cat.id!)} className="text-xs text-red-500 hover:text-red-700" title="Eliminar">🗑</button>
                  )}
                </div>
                {getChildren(cat.id!).map(child => (
                  <div key={child.id} className="flex items-center gap-2 p-2 pl-8 ml-4 border-l-2 border-blue-200 bg-blue-50/30 rounded-r-lg hover:bg-blue-50/60">
                    <span className="text-sm text-gray-600 flex-1">
                      {editingId === child.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleUpdate(child.id!)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                          autoFocus
                        />
                      ) : (
                        <span onDoubleClick={() => { setEditingId(child.id!); setEditName(child.name) }}>└─ {child.name}</span>
                      )}
                    </span>
                    {editingId === child.id ? (
                      <>
                        <button onClick={() => handleUpdate(child.id!)} className="text-xs text-green-600 hover:text-green-800">💾</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                      </>
                    ) : (
                      <button onClick={() => handleDelete(child.id!)} className="text-xs text-red-500 hover:text-red-700" title="Eliminar">🗑</button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}