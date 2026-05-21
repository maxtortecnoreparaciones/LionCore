import { Warehouse, WarehouseStock } from '../../services/db'

interface WarehousesViewProps {
  warehouses: Warehouse[]
  selectedWarehouse: number | null
  warehouseStock: WarehouseStock[]
  onSelectWarehouse: (id: number) => void
  onDeleteWarehouse: (id: number) => void
  onNewWarehouse: () => void
  onTransfer: () => void
}

export default function WarehousesView({
  warehouses,
  selectedWarehouse,
  warehouseStock,
  onSelectWarehouse,
  onDeleteWarehouse,
  onNewWarehouse,
  onTransfer,
}: WarehousesViewProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">📦 Bodegas</h2>
            <p className="text-sm text-gray-500">{warehouses.length} ubicaciones</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onTransfer}
              className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700"
            >
              🔄 Transferir
            </button>
            <button
              onClick={onNewWarehouse}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              + Bodega
            </button>
          </div>
        </div>

        {warehouses.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {warehouses.map(wh => (
              <div key={wh.id} className="flex items-center gap-1">
                <button
                  key={wh.id}
                  onClick={() => onSelectWarehouse(wh.id!)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
                    selectedWarehouse === wh.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {wh.name} {wh.isDefault ? '⭐' : ''}
                </button>
                {!wh.isDefault && (
                  <button
                    onClick={() => onDeleteWarehouse(wh.id!)}
                    className="text-red-500 hover:text-red-700 text-sm px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedWarehouse && warehouseStock.length > 0 && (
          <div className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
            {warehouseStock.map(stock => (
              <div key={stock.id} className="py-2 flex justify-between items-center">
                <div>
                  <span className="font-medium text-gray-800">{stock.productName}</span>
                  {stock.category && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {stock.category}
                    </span>
                  )}
                  {stock.imei && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                      IMEI: {stock.imei}
                    </span>
                  )}
                </div>
                <span className="font-bold text-gray-800">{stock.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
