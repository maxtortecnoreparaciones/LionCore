import { useState, useRef, useEffect } from 'react'
import { searchCustomers, searchSuppliers } from '../../services/db'

interface UniversalSearchProps {
  products: any[]
  onSelectProduct: (name: string) => void
  onSelectCustomer: () => void
  onSelectSupplier: () => void
  onNavigate: (section: string) => void
}

interface SearchResult {
  type: 'producto' | 'cliente' | 'proveedor'
  label: string
  sublabel: string
  section: string
  action: () => void
}

export default function UniversalSearch({ products, onSelectProduct, onSelectCustomer, onSelectSupplier, onNavigate: _onNavigate }: UniversalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); setShow(false); return }

    const ql = q.toLowerCase()
    const found: SearchResult[] = []

    // Products
    for (const p of products) {
      if (p.name.toLowerCase().includes(ql) || (p.code || '').toLowerCase().includes(ql) || (p.proveedor || '').toLowerCase().includes(ql) || (p.categoria || '').toLowerCase().includes(ql)) {
        found.push({
          type: 'producto',
          label: p.code ? `[${p.code}] ${p.name}` : p.name,
          sublabel: `$${p.price} · ${p.unidad || ''} · Stock: ${p.stock || 0}`,
          section: 'inventory',
          action: () => { onSelectProduct(p.name); setShow(false); setQuery('') },
        })
        if (found.length >= 5) break
      }
    }

    // Customers
    if (found.length < 5) {
      const customers = await searchCustomers(q)
      for (const c of customers) {
        found.push({
          type: 'cliente',
          label: c.name,
          sublabel: `${c.phone || ''} ${c.documento ? '· ' + c.documento : ''}`,
          section: 'customers',
          action: () => { onSelectCustomer(); setShow(false); setQuery('') },
        })
        if (found.length >= 5) break
      }
    }

    // Suppliers
    if (found.length < 5) {
      const suppliers = await searchSuppliers(q)
      for (const s of suppliers) {
        found.push({
          type: 'proveedor',
          label: s.empresa,
          sublabel: `${s.contacto || ''} ${s.phone ? '· ' + s.phone : ''}`,
          section: 'suppliers',
          action: () => { onSelectSupplier(); setShow(false); setQuery('') },
        })
        if (found.length >= 5) break
      }
    }

    setResults(found)
    setShow(true)
  }

  const typeIcon = (t: string) => {
    switch (t) {
      case 'producto': return '📦'
      case 'cliente': return '👤'
      case 'proveedor': return '🏭'
      default: return '🔍'
    }
  }

  return (
    <div ref={ref} className="relative" style={{ minWidth: 280 }}>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => { if (results.length) setShow(true) }}
          placeholder="Buscar producto, código, cliente, proveedor..."
          className="w-full py-1.5 pl-7 pr-3 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
        />
      </div>
      {show && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 max-h-80 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={r.action}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-0"
            >
              <span className="text-sm shrink-0">{typeIcon(r.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{r.label}</p>
                <p className="text-[10px] text-gray-400 truncate">{r.sublabel}</p>
              </div>
              <span className="text-[9px] text-gray-300 uppercase shrink-0">{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}