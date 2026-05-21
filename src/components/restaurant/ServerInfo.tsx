interface ServerInfoProps {
  serverInfo: { ip: string; url: string; qr: string | null } | null
  onClose: () => void
}

const ServerInfo: React.FC<ServerInfoProps> = ({ serverInfo, onClose }) => {
  if (!serverInfo) return null

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-blue-200">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-sm font-bold text-gray-800 mb-1">📡 Conexión local</h4>
          <p className="text-xs text-gray-500">Abre en el celular de meseros o cocina:</p>
          <p className="text-lg font-bold text-blue-600 mt-1">{serverInfo.url}</p>
          <div className="flex gap-2 mt-2">
            <a href={`${serverInfo.url}/waiter`} target="_blank" className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-semibold hover:bg-gray-700" rel="noreferrer">📱 Mesero</a>
            <a href={`${serverInfo.url}/kitchen`} target="_blank" className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-400" rel="noreferrer">👨‍🍳 Cocina</a>
          </div>
        </div>
        {serverInfo.qr && (
          <img src={serverInfo.qr} alt="QR" className="w-20 h-20 rounded" />
        )}
      </div>
      <button onClick={onClose} className="mt-2 text-xs text-gray-400 hover:text-gray-600">Cerrar</button>
    </div>
  )
}

export default ServerInfo
