import { getDeviceId } from '../../services/license'

interface AppHeaderProps {
  licenseState: { isActivated: boolean; plan: string }
  licenseStatusCheck: { daysLeft: number }
  currentTpl: { emoji: string; label: string }
  currentBusinessType: string
  showConfig: boolean
  showSummary: boolean
  showHistory: boolean
  showInventory: boolean
  showFruverDashboard: boolean
  showServices: boolean
  showCustomers: boolean
  showSuppliers: boolean
  showInventoryHistory: boolean
  showCategories: boolean
  showProcessConfig: boolean
  showProcessExecution: boolean
  showResources: boolean
  showMoreMenu: boolean
  onShowDeviceModal: () => void
  onShowLicenseModal: () => void
  onShowUpgradeModal: (msg: { title: string; message: string }) => void
  onToggleConfig: () => void
  onToggleSummary: () => void
  onToggleHistory: () => void
  onToggleInventory: () => void
  onToggleFruverDashboard: () => void
  onToggleServices: () => void
  onToggleMoreMenu: () => void
  onToggleCustomers: () => void
  onToggleSuppliers: () => void
  onToggleInventoryHistory: () => void
  onToggleCategories: () => void
  onToggleProcessConfig: () => void
  onToggleProcessExecution: () => void
  onToggleResources: () => void
  onSetShowMoreMenu: (v: boolean) => void
  onSetShowReferrals: (v: boolean) => void
  onExportCSV: () => Promise<void>
  onLoadFruverDashboard: () => Promise<void>
  onLoadServiceOrders: () => Promise<void>
  onSetInventory: (data: any[]) => void
  isFeatureAllowed: (feature: 'produccion' | 'compra' | 'gastos' | 'config' | 'inventory' | 'export') => boolean
  getUpgradeMessage: (feature: string) => { title: string; message: string }
  getStockByProduct: () => Promise<any[]>
}

const AppHeader: React.FC<AppHeaderProps> = ({
  licenseState, licenseStatusCheck, currentTpl, currentBusinessType,
  showConfig, showSummary, showHistory, showInventory, showFruverDashboard, showServices, showCustomers: _showCustomers, showMoreMenu,
  onShowDeviceModal, onShowLicenseModal, onShowUpgradeModal,
  onToggleConfig, onToggleSummary, onToggleHistory, onToggleInventory, onToggleFruverDashboard, onToggleServices,
  onToggleMoreMenu, onSetShowMoreMenu, onSetShowReferrals, onExportCSV,
  onToggleCustomers, onToggleSuppliers, onToggleInventoryHistory, onToggleCategories,
  onToggleProcessConfig, onToggleProcessExecution, onToggleResources,
  onLoadFruverDashboard, onLoadServiceOrders,
  onSetInventory,
  isFeatureAllowed, getUpgradeMessage, getStockByProduct }) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold text-gray-800">LionCore POS</h1>
        {licenseState.isActivated && (
          <span
            className={`text-xs px-2 py-1 rounded-full font-semibold cursor-pointer ${licenseState.plan === 'pro' ? 'bg-purple-100 text-purple-700' : licenseState.plan === 'enterprise' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}
            onClick={onShowDeviceModal}
            title="Click para ver info del dispositivo"
          >
            {licenseState.plan.toUpperCase()} {licenseStatusCheck.daysLeft >= 0 && `(${licenseStatusCheck.daysLeft}d)`}
          </span>
        )}
        {!licenseState.isActivated && (
          <span className="text-xs px-2 py-1 rounded-full font-semibold bg-red-100 text-red-600">
            FREE
          </span>
        )}
        <span className="text-xs px-2 py-1 rounded-full font-semibold bg-gray-100 text-gray-600" title="Tipo de negocio activo">
          {currentTpl.emoji} {currentTpl.label}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onShowDeviceModal}
          className="px-3 py-2 rounded-lg font-semibold text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 max-w-48 truncate"
          title="Click para ver Device ID completo"
        >
          💻 ...{getDeviceId().slice(-8)}
        </button>
        {!licenseState.isActivated && (
          <button
            onClick={onShowLicenseModal}
            className="px-4 py-2 rounded-lg font-semibold transition-colors bg-amber-500 text-white hover:bg-amber-600"
          >
            🔑 Activar
          </button>
        )}
        <button
          onClick={() => {
            if (!isFeatureAllowed('config')) {
              onShowUpgradeModal(getUpgradeMessage('config'))
              return
            }
            onToggleConfig()
          }}
          className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${showConfig ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
        >
          ⚙️
        </button>
        <button
          onClick={async () => {
            if (!showInventory) {
              const stockData = await getStockByProduct()
              onSetInventory(stockData)
            }
            onToggleInventory()
          }}
          className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${showInventory ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
        >
          📦
        </button>

        {currentBusinessType === 'fruver' && (
          <button
            onClick={async () => {
              onToggleFruverDashboard()
              if (!showFruverDashboard) {
                await onLoadFruverDashboard()
              }
            }}
            className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${showFruverDashboard ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
          >
            📊
          </button>
        )}
        {currentBusinessType !== 'restaurante' && (
          <button
            onClick={async () => {
              onToggleServices()
              if (!showServices) {
                await onLoadServiceOrders()
              }
            }}
            className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${showServices ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
          >
            🔧
          </button>
        )}
        <div className="relative">
          <button
            onClick={onToggleMoreMenu}
            className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${showSummary || showHistory ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
          >
            ⋮
          </button>
          {showMoreMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
              <button
                onClick={() => { onToggleSummary(); onSetShowMoreMenu(false) }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span>📊</span> Resumen
              </button>
              <button
                onClick={() => { onToggleHistory(); onSetShowMoreMenu(false) }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span>📋</span> Historial
              </button>
              {(showHistory || showSummary) && (
                <>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={onExportCSV}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>📥</span> Exportar CSV
                  </button>
                </>
              )}
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={() => { onSetShowReferrals(true); onSetShowMoreMenu(false) }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span>🎁</span> Invitar y ganar
              </button>
              <button
                onClick={() => { onToggleCustomers(); onSetShowMoreMenu(false) }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span>👥</span> Clientes
              </button>
              <button
                onClick={() => { onToggleSuppliers(); onSetShowMoreMenu(false) }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span>🏭</span> Proveedores
              </button>
              <button
                onClick={() => { onToggleInventoryHistory(); onSetShowMoreMenu(false) }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span>📜</span> Historial Inventario
              </button>
              <button
                onClick={() => { onToggleCategories(); onSetShowMoreMenu(false) }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span>📂</span> Categorías
              </button>
              <button
                onClick={() => { onToggleProcessConfig(); onSetShowMoreMenu(false) }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span>⚙️</span> Procesos
              </button>
              <button
                onClick={() => { onToggleProcessExecution(); onSetShowMoreMenu(false) }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span>🏭</span> Producción Lotes
              </button>
              <button
                onClick={() => { onToggleResources(); onSetShowMoreMenu(false) }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span>🔧</span> Recursos
              </button>
              <button
                onClick={() => { onToggleConfig(); onSetShowMoreMenu(false) }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <span>⚙️</span> Configuracion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AppHeader
