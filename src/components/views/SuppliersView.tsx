import { useState, useEffect } from 'react'
import { Supplier, createSupplier, updateSupplier, deactivateSupplier, searchSuppliers, getActiveSuppliers } from '../../services/db'

interface SuppliersViewProps {
  show: boolean
}

interface SupplierForm {
  empresa: string
  contacto: string
  phone: string
  email: string
  direccion: string
  notas: string
}

const emptyForm = (): SupplierForm => ({ empresa: '', contacto: '', phone: '', email: '', direccion: '', notas: '' })

export default function SuppliersView({ show }: SuppliersViewProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SupplierForm>(emptyForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (show) load() }, [show])

  const load = async () => {
    setLoading(true)
    const data = search ? await searchSuppliers(search) : await getActiveSuppliers()
    setSuppliers(data)
    setLoading(false)
  }

  if (!show) return null

  const handleSave = async () => {
    if (!form.empresa.trim()) return
    if (editingId) {
      await updateSupplier(editingId, { empresa: form.empresa.trim(), contacto: form.contacto.trim() || undefined, phone: form.phone.trim() || undefined, email: form.email.trim() || undefined, direccion: form.direccion.trim() || undefined, notas: form.notas.trim() || undefined })
    } else {
      await createSupplier({ empresa: form.empresa.trim(), contacto: form.contacto.trim() || undefined, phone: form.phone.trim() || undefined, email: form.email.trim() || undefined, direccion: form.direccion.trim() || undefined, notas: form.notas.trim() || undefined })
    }
    setForm(emptyForm())
    setEditingId(null)
    setShowForm(false)
    load()
  }

  const handleEdit = (s: Supplier) => {
    setForm({ empresa: s.empresa, contacto: s.contacto || '', phone: s.phone || '', email: s.email || '', direccion: s.direccion || '', notas: s.notas || '' })
    setEditingId(s.id!)
    setShowForm(true)
  }

  const handleDeactivate = async (id: number) => {
    await deactivateSupplier(id)
    load()
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">🏭 Proveedores</h2>
        <button onClick={() => { setForm(emptyForm()); setEditingId(null); setShowForm(true) }} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700">+ Nuevo</button>
      </div>

      <div className="p-4">
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); if (e.target.value.length >= 2 || !e.target.value) load() }} placeholder="Buscar por empresa, contacto, teléfono o email..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4" />

        {showForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3 border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Empresa *</label>
                <input type="text" value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contacto</label>
                <input type="text" value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Dirección</label>
                <input type="text" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
                <input type="text" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700">{editingId ? 'Guardar Cambios' : 'Crear Proveedor'}</button>
              <button onClick={() => { setShowForm(false); setForm(emptyForm()); setEditingId(null) }} className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-8">Cargando...</p>
        ) : suppliers.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay proveedores</p>
        ) : (
          <div className="space-y-2">
            {suppliers.map(s => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">{s.empresa}</p>
                  <p className="text-xs text-gray-500">
                    {s.contacto && <span>👤 {s.contacto}</span>}
                    {s.phone && <span className="ml-3">📞 {s.phone}</span>}
                    {s.email && <span className="ml-3">✉️ {s.email}</span>}
                    {s.totalPurchases > 0 && <span className="ml-3">🛒 {s.totalPurchases} compras</span>}
                  </p>
                  {s.notas && <p className="text-xs text-gray-400 mt-0.5">📝 {s.notas}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEdit(s)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded" title="Editar">✏️</button>
                  {s.estado === 'activo' && (
                    <button onClick={() => handleDeactivate(s.id!)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded" title="Desactivar">🚫</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}