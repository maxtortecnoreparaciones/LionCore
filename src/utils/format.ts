export const formatCOP = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const getTypeStyle = (type: string): string => {
  switch (type) {
    case 'venta':
      return 'bg-green-100 text-green-700'
    case 'compra':
      return 'bg-blue-100 text-blue-700'
    case 'gasto':
      return 'bg-red-100 text-red-700'
    case 'produccion':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}
