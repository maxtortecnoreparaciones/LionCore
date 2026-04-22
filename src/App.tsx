import { useState } from 'react'

type Mode = 'venta' | 'compra' | 'gasto'

interface Item {
  id: number
  producto: string
  cantidad: number
  precio: number
}

const formatCOP = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function App() {
  const [mode, setMode] = useState<Mode>('venta')
  const [producto, setProducto] = useState('')
  const [cantidad, setCantidad] = useState<number>(1)
  const [precio, setPrecio] = useState<number>(0)
  const [items, setItems] = useState<Item[]>([])

  const total = items.reduce((sum, item) => sum + item.cantidad * item.precio, 0)

  const handleAgregar = () => {
    if (!producto.trim() || cantidad <= 0 || precio <= 0) return

    const newItem: Item = {
      id: Date.now(),
      producto: producto.trim(),
      cantidad,
      precio,
    }

    setItems([...items, newItem])
    setProducto('')
    setCantidad(1)
    setPrecio(0)
  }

  const handleGuardar = () => {
    if (items.length === 0) return

    const transaction = {
      mode,
      items,
      total,
      timestamp: new Date().toISOString(),
    }

    console.log('Guardando transacción:', transaction)
    setItems([])
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>LionCore POS</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {(['venta', 'compra', 'gasto'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: '10px',
              textTransform: 'uppercase',
              background: mode === m ? '#2563eb' : '#e5e7eb',
              color: mode === m ? '#fff' : '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Producto"
          value={producto}
          onChange={(e) => setProducto(e.target.value)}
          style={{ flex: 2, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <input
          type="number"
          placeholder="Cantidad"
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          min={1}
          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', textAlign: 'center' }}
        />
        <input
          type="number"
          placeholder="Precio (COP)"
          value={precio}
          onChange={(e) => setPrecio(Number(e.target.value))}
          min={0}
          step={100}
          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', textAlign: 'right' }}
        />
        <button
          onClick={handleAgregar}
          style={{
            padding: '10px 20px',
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Agregar
        </button>
      </div>

      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', marginBottom: '20px', minHeight: '150px' }}>
        {items.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', margin: '50px 0' }}>Sin productos agregados</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                borderBottom: '1px solid #eee',
              }}
            >
              <span>{item.producto}</span>
              <span>x{item.cantidad}</span>
              <span>{formatCOP(item.cantidad * item.precio)}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Total</h2>
        <h2 style={{ fontSize: '2em', margin: 0 }}>{formatCOP(total)}</h2>
      </div>

      <button
        onClick={handleGuardar}
        disabled={items.length === 0}
        style={{
          width: '100%',
          padding: '15px',
          background: items.length === 0 ? '#ccc' : '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: items.length === 0 ? 'not-allowed' : 'pointer',
          fontSize: '1.2em',
          fontWeight: 'bold',
        }}
      >
        Guardar
      </button>
    </div>
  )
}

export default App