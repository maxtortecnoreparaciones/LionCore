import { useState, useEffect } from 'react'
import { Customer, createCustomer, updateCustomer, deactivateCustomer, searchCustomers, getActiveCustomers } from '../../services/db'

interface CustomersViewProps {
  show: boolean
}

interface CustomerForm {
  name: string
  documento: string
  phone: string
  email: string
  direccion: string
  notas: string
}

const emptyForm = (): CustomerForm => ({ name: '', documento: '', phone: '', email: '', direccion: '', notas: '' })

export default function CustomersView({ show }: CustomersViewProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CustomerForm>(emptyForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (show) load() }, [show])

  const load = async () => {
    setLoading(true)
    const data = search ? await searchCustomers(search) : await getActiveCustomers()
    setCustomers(data)
    setLoading(false)
  }

  if (!show) return null

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (editingId) {
      await updateCustomer(editingId, { name: form.name.trim(), documento: form.documento.trim() || undefined, phone: form.phone.trim() || undefined, email: form.email.trim() || undefined, direccion: form.direccion.trim() || undefined, notas: form.notas.trim() || undefined })
    } else {
      await createCustomer({ name: form.name.trim(), documento: form.documento.trim() || undefined, phone: form.phone.trim() || undefined, email: form.email.trim() || undefined, direccion: form.direccion.trim() || undefined, notas: form.notas.trim() || undefined })
    }
    setForm(emptyForm())
    setEditingId(null)
    setShowForm(false)
    load()
  }

  const handleEdit = (c: Customer) => {
    setForm({ name: c.name, documento: c.documento || '', phone: c.phone || '', email: c.email || '', direccion: c.direccion || '', notas: c.notas || '' })
    setEditingId(c.id!)
    setShowForm(true)
  }

  const handleDeactivate = async (id: number) => {
    await deactivateCustomer(id)
    load()
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">👥 Clientes</h2>
        <button onClick={() => { setForm(emptyForm()); setEditingId(null); setShowForm(true) }} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700">+ Nuevo</button>
      </div>

      <div className="p-4">
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); if (e.target.value.length >= 2 || !e.target.value) load() }} placeholder="Buscar por nombre, documento, teléfono o email..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4" />

        {showForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3 border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Documento</label>
                <input type="text" value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
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
              <button onClick={handleSave} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700">{editingId ? 'Guardar Cambios' : 'Crear Cliente'}</button>
              <button onClick={() => { setShowForm(false); setForm(emptyForm()); setEditingId(null) }} className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-8">Cargando...</p>
        ) : customers.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay clientes</p>
        ) : (
          <div className="space-y-2">
            {customers.map(c => (
              <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">
                    {c.name}
                    {c.documento && <span className="text-xs text-gray-400 ml-2">📄 {c.documento}</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.phone && <span>📞 {c.phone}</span>}
                    {c.email && <span className="ml-3">✉️ {c.email}</span>}
                    {c.totalPurchases > 0 && <span className="ml-3">🛒 {c.totalPurchases} compras</span>}
                  </p>
                  {c.notas && <p className="text-xs text-gray-400 mt-0.5">📝 {c.notas}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEdit(c)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded" title="Editar">✏️</button>
                  {c.estado === 'activo' && (
                    <button onClick={() => handleDeactivate(c.id!)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded" title="Desactivar">🚫</button>
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