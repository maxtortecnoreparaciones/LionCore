import { useState, useEffect } from 'react'
import { Product, getFavoriteProducts, getMostSoldProducts, getRecentProducts, toggleFavorite } from '../../services/db'
import { formatCOP } from '../../utils/format'

interface FavoritesBarProps {
  businessId: number
  onSelectProduct: (product: Product) => void
}

export default function FavoritesBar({ onSelectProduct }: FavoritesBarProps) {
  const [tab, setTab] = useState<'favorites' | 'topsold' | 'recent'>('favorites')
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => { loadProducts() }, [tab])

  const loadProducts = async () => {
    if (tab === 'favorites') {
      const favs = await getFavoriteProducts()
      setProducts(favs.length > 0 ? favs : await getMostSoldProducts(20).then(r => r.map(x => x.product)))
    } else if (tab === 'topsold') {
      setProducts((await getMostSoldProducts(20)).map(x => x.product))
    } else {
      setProducts(await getRecentProducts(20))
    }
  }

  const handleToggleFav = async (e: React.MouseEvent, p: Product) => {
    e.stopPropagation()
    if (p.id) await toggleFavorite(p.id)
    loadProducts()
  }

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {(['favorites', 'topsold', 'recent'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${tab === t ? 'bg-lion text-white' : 'bg-gray-100 text-gray-500'}`}>
            {t === 'favorites' ? '⭐ Favoritos' : t === 'topsold' ? '🔥 Más vendidos' : '🕐 Recientes'}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
        {products.map(p => (
          <button key={p.id} onClick={() => onSelectProduct(p)}
            className="snap-start shrink-0 w-36 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-lion/30 active:scale-[0.97] transition-all text-left flex flex-col justify-between min-h-[4.5rem]">
            <div className="flex items-start justify-between gap-1">
              <span className="text-[13px] font-semibold text-gray-800 leading-tight line-clamp-2">{p.name}</span>
              <button onClick={e => handleToggleFav(e, p)}
                className="shrink-0 text-sm">{p.favorite ? '⭐' : '☆'}</button>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-bold text-lion">{formatCOP(p.price)}</span>
              {p.stock !== undefined && (
                <span className={`text-[10px] font-medium ${(p.stock || 0) <= 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {p.stock} disp.
                </span>
              )}
            </div>
          </button>
        ))}
        {products.length === 0 && (
          <p className="text-sm text-gray-400 py-4 w-full text-center">Marca productos como ⭐ favoritos para verlos aquí</p>
        )}
      </div>
    </div>
  )
}
