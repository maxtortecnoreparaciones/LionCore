import { Mesa } from '../../services/db'
import { formatCOP } from '../../utils/format'

interface MesaCardProps {
  mesa: Mesa
  onClick: (mesa: Mesa) => void
}

const MesaCard: React.FC<MesaCardProps> = ({ mesa, onClick }) => {
  const statusColor = mesa.status === 'disponible' ? 'bg-green-100 border-green-300 text-green-700' :
    mesa.status === 'abierta' ? 'bg-blue-100 border-blue-300 text-blue-700' :
    mesa.status === 'ocupada' ? 'bg-orange-100 border-orange-300 text-orange-700' :
    'bg-purple-100 border-purple-300 text-purple-700'

  return (
    <button
      onClick={() => onClick(mesa)}
      className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-md ${statusColor}`}
    >
      <p className="font-bold text-sm">{mesa.name}</p>
      <p className="text-xs mt-1 capitalize">{mesa.status}</p>
      {(mesa.status === 'ocupada' || mesa.status === 'cuenta') && mesa.createdAt && (
        <p className="text-[10px] mt-0.5 opacity-75">{Math.floor((Date.now() - new Date(mesa.createdAt).getTime()) / 60000)} min</p>
      )}
      {mesa.total > 0 && (
        <p className="text-xs font-bold mt-1">{formatCOP(mesa.total)}</p>
      )}
    </button>
  )
}

export default MesaCard
