interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  businessType: string
}

const TABS: { key: string; icon: string; label: string }[] = [
  { key: 'vender', icon: '🛒', label: 'Vender' },
  { key: 'inventario', icon: '📦', label: 'Inventario' },
  { key: 'clientes', icon: '👥', label: 'Clientes' },
  { key: 'reportes', icon: '📊', label: 'Reportes' },
  { key: 'mas', icon: '⚙️', label: 'Más' },
]

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="flex items-center justify-around bg-white border-t border-gray-200 py-1 px-1 safe-area-bottom">
      {TABS.map(tab => (
        <button key={tab.key} onClick={() => onTabChange(tab.key)}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all min-w-0 ${
            activeTab === tab.key ? 'text-lion bg-lion/10' : 'text-gray-400 hover:text-gray-600'
          }`}>
          <span className="text-xl leading-none">{tab.icon}</span>
          <span className="text-[10px] font-semibold leading-tight">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
