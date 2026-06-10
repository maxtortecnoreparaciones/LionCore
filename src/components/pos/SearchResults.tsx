import { useState, useEffect, useRef } from 'react'
import { Product, searchProducts } from '../../services/db'
import { formatCOP } from '../../utils/format'

interface SearchResultsProps {
  onSelectProduct: (product: Product) => void
  placeholder?: string
  autoFocus?: boolean
}

export default function SearchResults({ onSelectProduct, placeholder, autoFocus }: SearchResultsProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      const r = await searchProducts(query)
      setResults(r)
      setOpen(true)
    }, 80)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (p: Product) => {
    onSelectProduct(p)
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
        <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder || 'Buscar producto o escanear código...'}
          autoFocus={autoFocus}
          className="w-full py-3 pl-10 pr-4 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-lion focus:ring-2 focus:ring-lion/20 transition-all" />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
          {results.slice(0, 15).map(p => (
            <button key={p.id} onClick={() => handleSelect(p)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-left active:bg-lion/10 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800 truncate">{p.name}</span>
                  {p.code && <span className="text-[10px] font-mono text-gray-400 shrink-0">{p.code}</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                  <span className="font-bold text-lion">{formatCOP(p.price)}</span>
                  {(p.stock !== undefined) && (
                    <span className={`font-medium ${(p.stock || 0) <= 0 ? 'text-red-400' : 'text-gray-500'}`}>
                      Stock: {p.stock}
                    </span>
                  )}
                  {p.ubicacion && <span className="text-gray-400">📍 {p.ubicacion}</span>}
                </div>
              </div>
              <span className="text-lg shrink-0">+</span>
            </button>
          ))}
          {results.length > 15 && (
            <p className="p-2 text-[10px] text-gray-400 text-center">+{results.length - 15} más resultados</p>
          )}
        </div>
      )}
    </div>
  )
}
