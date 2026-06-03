import { useState, useEffect } from 'react'
import {
  ProductionBatch, BatchStepLog, BatchProduct, Product, ProductionBatchRun,
  getRawMaterials,
  createUnifiedBatch, startUnifiedBatch, completeUnifiedBatch, cancelUnifiedBatch,
  getProductionBatches, getBatchProducts, getBatchSteps,
  startBatchStep, completeBatchStep, getActiveResources,
  getProductionDashboard, getProductions, BatchOutputInput,
  getProductionProcesses, createProductionProcess,
  db, getProducts, getCurrentBusinessId, getBatchRuns, createBatchRun, completeBatchRun,
} from '../../services/db'

interface ProcessExecutionViewProps {
  show: boolean
}

export default function ProcessExecutionView({ show }: ProcessExecutionViewProps) {
  const [batches, setBatches] = useState<ProductionBatch[]>([])
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null)
  const [steps, setSteps] = useState<BatchStepLog[]>([])
  const [batchOutputs, setBatchOutputs] = useState<BatchProduct[]>([])
  const [loading, setLoading] = useState(false)

  // Quick create form
  const [rawMaterial, setRawMaterial] = useState('')
  const [rawQty, setRawQty] = useState('')
  const [outputName, setOutputName] = useState('')
  const [outputQty, setOutputQty] = useState('')
  const [batchNotes, setBatchNotes] = useState('')

  // Inline product creation
  const [showNewRaw, setShowNewRaw] = useState(false)
  const [newRawName, setNewRawName] = useState('')
  const [newRawCode, setNewRawCode] = useState('')
  const [newRawUnit, setNewRawUnit] = useState('kg')

  // Avatar quality fields
  const [avatarHumedad, setAvatarHumedad] = useState('')
  const [avatarTemperatura, setAvatarTemperatura] = useState('')
  const [avatarTiempo, setAvatarTiempo] = useState('')
  const [avatarGrado, setAvatarGrado] = useState('estandar')

  // Cost tracking
  const [costoEntrada, setCostoEntrada] = useState('')
  const [resources, setResources] = useState<{ id: number; name: string; type: string }[]>([])
  // Tandas
  const [tandas, setTandas] = useState<ProductionBatchRun[]>([])
  const [showNewTanda, setShowNewTanda] = useState(false)
  const [newTandaQty, setNewTandaQty] = useState('')
  const [newTandaResource, setNewTandaResource] = useState('')

  const [rawMaterials, setRawMaterials] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])

  // Dashboard
  const [dashboard, setDashboard] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])

  // Processos inline
  const [processes, setProcesses] = useState<any[]>([])
  const [showNewProcess, setShowNewProcess] = useState(false)
  const [newProcessName, setNewProcessName] = useState('')

  // Step modal
  const [operarios, setOperarios] = useState<{ id: number; name: string }[]>([])
  const [stepModal, setStepModal] = useState<{ step: BatchStepLog; action: 'start' | 'complete' } | null>(null)
  const [stepWeightIn, setStepWeightIn] = useState('')
  const [stepWeightOut, setStepWeightOut] = useState('')
  const [stepObservations, setStepObservations] = useState('')
  const [stepOperator, setStepOperator] = useState('')
  const [stepResource, setStepResource] = useState('')

  const [activeTab, setActiveTab] = useState<'form' | 'lotes' | 'stats'>('form')

  // Auto-fill cost when raw material or quantity changes
  useEffect(() => {
    if (rawMaterial && rawQty) {
      const raw = rawMaterials.find(p => p.name === rawMaterial)
      if (raw?.cost) {
        setCostoEntrada((raw.cost * Number(rawQty)).toString())
      }
    }
  }, [rawMaterial, rawQty])

  useEffect(() => { if (show) { loadAll() } }, [show])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadBatches(), loadProducts(), loadDashboard(), loadOperarios(), loadProcesses(), loadResources()])
    setLoading(false)
  }

  const loadProducts = async () => {
    setRawMaterials(await getRawMaterials())
    setAllProducts(await getProducts())
  }
  const loadBatches = async () => { setBatches(await getProductionBatches()) }
  const loadDashboard = async () => { setDashboard(await getProductionDashboard()); setHistory(await getProductions()) }
  const loadOperarios = async () => { setOperarios((await getActiveResources('OPERARIO')).map(r => ({ id: r.id!, name: r.name }))) }
  const loadProcesses = async () => { setProcesses(await getProductionProcesses()) }
  const loadResources = async () => { setResources((await getActiveResources()) as any) }
  const loadSteps = async (batchId: number) => {
    setSteps(await getBatchSteps(batchId))
    setBatchOutputs(await getBatchProducts(batchId))
    setTandas(await getBatchRuns(batchId))
  }

  if (!show) return null

  const handleSelectBatch = async (id: number) => {
    setSelectedBatch(id)
    await loadSteps(id)
  }

  const handleCreateProcess = async () => {
    if (!newProcessName.trim()) return
    await createProductionProcess({ name: newProcessName.trim(), type: 'produccion', requiresTime: true, requiresWeight: false, active: true })
    setNewProcessName('')
    setShowNewProcess(false)
    await loadProcesses()
  }

  const handleCreateTanda = async () => {
    if (!selectedBatch || !newTandaQty) return
    const resource = newTandaResource ? resources.find(r => r.id === Number(newTandaResource)) : undefined
    await createBatchRun(selectedBatch, Number(newTandaQty), resource?.id, resource?.name)
    setShowNewTanda(false)
    setNewTandaQty('')
    setNewTandaResource('')
    if (selectedBatch) await loadSteps(selectedBatch)
    await loadBatches()
  }

  const handleCompleteTanda = async (tandaId: number) => {
    if (!confirm('¿Completar esta tanda? Los pasos pendientes se marcaran como completados.')) return
    await completeBatchRun(tandaId)
    if (selectedBatch) await loadSteps(selectedBatch)
    await loadBatches()
  }

  const handleCreateRawMaterial = async () => {
    if (!newRawName.trim()) return
    const businessId = getCurrentBusinessId()
    await db.products.add({
      businessId,
      name: newRawName.trim(),
      code: newRawCode.trim() || undefined,
      type: 'materia_prima',
      unidad: newRawUnit,
      price: 0,
      stock: 0,
      createdAt: new Date(),
    })
    await loadProducts()
    setRawMaterial(newRawName.trim())
    setShowNewRaw(false)
    setNewRawName('')
    setNewRawCode('')
  }

  const handleCreateBatch = async () => {
    if (!rawMaterial || !rawQty) return
    const raw = rawMaterials.find(p => p.name === rawMaterial)
    if (!raw?.id) { alert('Selecciona una materia prima valida'); return }

    let outputProduct = allProducts.find(p => p.name.toLowerCase() === outputName.trim().toLowerCase())
    if (!outputProduct && outputName.trim()) {
      const businessId = raw.businessId
      const newId = await db.products.add({
        businessId,
        name: outputName.trim(),
        type: 'producto_final',
        price: 0,
        stock: 0,
        unidad: raw.unidad || 'kg',
        createdAt: new Date(),
      })
      outputProduct = { id: newId, businessId, name: outputName.trim(), type: 'producto_final', price: 0, stock: 0, createdAt: new Date() }
    }
    if (!outputProduct?.id) { alert('Especifica un nombre para el producto final'); return }

    const outputs: BatchOutputInput[] = [{ finalProductId: outputProduct.id, finalProductQty: Number(outputQty) || Number(rawQty) * 0.3 }]

    const avatar = {
      humedad: avatarHumedad ? Number(avatarHumedad) : undefined,
      temperatura: avatarTemperatura ? Number(avatarTemperatura) : undefined,
      tiempoHoras: avatarTiempo ? Number(avatarTiempo) : undefined,
      grado: avatarGrado || undefined,
    }

    const batchId = await createUnifiedBatch(raw.id, Number(rawQty), outputs, batchNotes || undefined, avatar, costoEntrada ? Number(costoEntrada) : undefined)
    await startUnifiedBatch(batchId)

    setRawMaterial(''); setRawQty(''); setOutputName(''); setOutputQty('')
    setBatchNotes(''); setAvatarHumedad(''); setAvatarTemperatura(''); setAvatarTiempo(''); setAvatarGrado('estandar')
    setCostoEntrada('')
    await loadBatches()
    await handleSelectBatch(batchId)
    setActiveTab('lotes')
  }

  const handleStartStep = async () => {
    if (!stepModal) return
    const resource = stepResource ? resources.find(r => r.id === Number(stepResource)) : undefined
    await startBatchStep(stepModal.step.id!, {
      weightIn: stepWeightIn ? Number(stepWeightIn) : undefined,
      operatorId: stepOperator ? Number(stepOperator) : undefined,
      resourceId: resource?.id,
      resourceName: resource?.name,
    })
    setStepWeightIn(''); setStepWeightOut(''); setStepObservations(''); setStepOperator(''); setStepResource('')
    setStepModal(null)
    if (selectedBatch) loadSteps(selectedBatch)
  }

  const handleCompleteStep = async () => {
    if (!stepModal) return
    if (!stepWeightOut) { alert('Debes registrar el peso de salida (kg) antes de finalizar'); return }
    const resource = stepResource ? resources.find(r => r.id === Number(stepResource)) : undefined
    await completeBatchStep(stepModal.step.id!, {
      weightIn: stepWeightIn ? Number(stepWeightIn) : undefined,
      weightOut: Number(stepWeightOut),
      observations: stepObservations || undefined,
      operatorId: stepOperator ? Number(stepOperator) : undefined,
      resourceId: resource?.id,
      resourceName: resource?.name,
    })
    setStepWeightIn(''); setStepWeightOut(''); setStepObservations(''); setStepOperator(''); setStepResource('')
    setStepModal(null)
    if (selectedBatch) loadSteps(selectedBatch)
  }

  const handleCompleteBatch = async (id: number) => {
    if (!confirm('¿Finalizar este lote? Se transformara el inventario automaticamente.')) return
    await completeUnifiedBatch(id)
    await loadBatches(); await loadDashboard()
    setSelectedBatch(null)
  }

  const handleCancelBatch = async (id: number) => {
    if (!confirm('¿Cancelar este lote?')) return
    await cancelUnifiedBatch(id)
    await loadBatches()
    setSelectedBatch(null)
  }

  const handleExportBatch = (batchId: number) => {
    const batch = batches.find(b => b.id === batchId)
    if (!batch) return
    const data = {
      lote: batch.loteId,
      materia_prima: batch.rawMaterialName,
      cantidad_entrada: batch.rawMaterialQty,
      avatar: {
        humedad: batch.avatarHumedad,
        temperatura: batch.avatarTemperatura,
        tiempo_horas: batch.avatarTiempoHoras,
        grado: batch.avatarGrado,
      },
      productos: batchOutputs.map(bp => ({
        nombre: bp.finalProductName,
        cantidad: bp.finalProductQty,
        merma: bp.wasteQty,
        rendimiento: bp.rendimiento.toFixed(1) + '%',
        costo_unitario: bp.costoUnitario,
      })),
      pasos: steps.map(s => ({
        flujo: s.runId,
        proceso: s.processName,
        estado: s.status,
        inicio: s.startTime?.toISOString(),
        fin: s.endTime?.toISOString(),
        peso_entrada: s.weightIn,
        peso_salida: s.weightOut,
        merma: s.wasteQty,
        observaciones: s.observations,
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lote_${batch.loteId}_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportAll = () => {
    const all = history.map(prod => ({
      lote: prod.loteId,
      fecha: new Date(prod.date).toISOString().split('T')[0],
      entrada: prod.rawMaterialName,
      cant_entrada: prod.rawMaterialQty,
      salida: prod.finalProductName,
      cant_salida: prod.finalProductQty,
      merma: prod.wasteQty,
      rendimiento: prod.rendimiento.toFixed(1) + '%',
      costo_unit: prod.costoUnitario,
      humedad: prod.avatarHumedad ?? '',
      temperatura: prod.avatarTemperatura ?? '',
      tiempo_h: prod.avatarTiempoHoras ?? '',
      grado: prod.avatarGrado ?? '',
    }))
    const csv = ['lote,fecha,entrada,cant_entrada,salida,cant_salida,merma,rendimiento,costo_unit,humedad%,temp°C,tiempo_h,grado']
      .concat(all.map(r => Object.values(r).join(',')))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `produccion_${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (d?: Date) => d ? new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—'
  const calcDuration = (start?: Date, end?: Date) => {
    if (!start) return null
    const s = new Date(start).getTime()
    const e = end ? new Date(end).getTime() : Date.now()
    const diff = Math.floor((e - s) / 1000)
    return `${Math.floor(diff / 60)}m ${diff % 60}s`
  }

  const selectedBatchData = batches.find(b => b.id === selectedBatch)

  // Compute enriched statistics
  const stepStats = steps.filter(s => s.startTime && s.endTime)
  const totalStepTime = stepStats.reduce((acc, s) => acc + (new Date(s.endTime!).getTime() - new Date(s.startTime!).getTime()), 0)
  const avgBatchTime = history.length > 0 ? (totalStepTime / history.length / 60000).toFixed(1) : '—'
  const totalWastePct = history.reduce((s, p) => s + p.wasteQty, 0)
  const totalInput = history.reduce((s, p) => s + p.rawMaterialQty, 0)
  const globalWastePct = totalInput > 0 ? ((totalWastePct / totalInput) * 100).toFixed(1) : '0'

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🏭 Produccion</h2>
          <p className="text-sm text-gray-500">Materia prima → Procesos → Producto final</p>
        </div>
        {activeTab === 'stats' && history.length > 0 && (
          <button onClick={handleExportAll} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200">
            📤 Exportar CSV
          </button>
        )}
      </div>

      {/* Dashboard */}
      {dashboard && (
        <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3 border-b border-gray-100">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-600 font-semibold">Producido</p>
            <p className="text-lg font-bold text-green-700">{dashboard.totalProduced.toFixed(1)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-xs text-red-600 font-semibold">Merma Total</p>
            <p className="text-lg font-bold text-red-700">{dashboard.totalWaste.toFixed(1)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-600 font-semibold">Rendimiento</p>
            <p className="text-lg font-bold text-blue-700">{dashboard.avgRendimiento.toFixed(1)}%</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-xs text-purple-600 font-semibold">Lotes</p>
            <p className="text-lg font-bold text-purple-700">{dashboard.totalBatches}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-600 font-semibold">Merma Global</p>
            <p className="text-lg font-bold text-amber-700">{globalWastePct}%</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button onClick={() => setActiveTab('form')} className={`flex-1 py-2.5 text-sm font-semibold ${activeTab === 'form' ? 'border-b-2 border-blue-600 text-blue-700 bg-white' : 'text-gray-500 hover:text-gray-700'}`}>+ Nuevo Lote</button>
        <button onClick={() => setActiveTab('lotes')} className={`flex-1 py-2.5 text-sm font-semibold ${activeTab === 'lotes' ? 'border-b-2 border-blue-600 text-blue-700 bg-white' : 'text-gray-500 hover:text-gray-700'}`}>📋 Lotes</button>
        <button onClick={() => setActiveTab('stats')} className={`flex-1 py-2.5 text-sm font-semibold ${activeTab === 'stats' ? 'border-b-2 border-blue-600 text-blue-700 bg-white' : 'text-gray-500 hover:text-gray-700'}`}>📊 Estadisticas</button>
      </div>

      <div className="p-4">
        {/* === TAB: Nuevo Lote === */}
        {activeTab === 'form' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Raw material selector + inline create */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🥝 Materia Prima</label>
                <div className="flex gap-2">
                  <select value={rawMaterial} onChange={e => setRawMaterial(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">Seleccionar...</option>
                    {rawMaterials.map(p => (
                      <option key={p.id} value={p.name}>{p.code ? `[${p.code}] ` : ''}{p.name} (Stock: {p.stock || 0})</option>
                    ))}
                  </select>
                  <button onClick={() => setShowNewRaw(true)} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 whitespace-nowrap">➕ Crear</button>
                </div>
                {showNewRaw && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                    <p className="text-xs font-semibold text-blue-700">Nueva Materia Prima</p>
                    <input type="text" value={newRawName} onChange={e => setNewRawName(e.target.value)} placeholder="Nombre (ej: Piña Fresca)" className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs" autoFocus />
                    <div className="flex gap-2">
                      <input type="text" value={newRawCode} onChange={e => setNewRawCode(e.target.value)} placeholder="Código (opcional)" className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-xs" />
                      <select value={newRawUnit} onChange={e => setNewRawUnit(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded text-xs">
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="unidad">unidad</option>
                        <option value="lb">lb</option>
                        <option value="l">l</option>
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { setShowNewRaw(false); setNewRawName(''); setNewRawCode('') }} className="px-2 py-1 text-xs text-gray-500">Cancelar</button>
                      <button onClick={handleCreateRawMaterial} disabled={!newRawName.trim()} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 disabled:bg-gray-300">Crear</button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Entrada</label>
                <input type="number" value={rawQty} onChange={e => setRawQty(e.target.value)} placeholder="Ej: 10" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🍍 Producto Final (nombre)</label>
                <div className="relative">
                  <input type="text" value={outputName} onChange={e => setOutputName(e.target.value)}
                    placeholder="Ej: Piña Deshidratada"
                    list="output-suggestions"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                  <datalist id="output-suggestions">
                    {allProducts.filter(p => p.type === 'producto_final').map(p => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Si no existe, se crea automaticamente al iniciar el lote</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Obtenida (estimada)</label>
                <input type="number" value={outputQty} onChange={e => setOutputQty(e.target.value)} placeholder="Ej: 7" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">💰 Costo Entrada ($)</label>
                <input type="number" value={costoEntrada} onChange={e => setCostoEntrada(e.target.value)} placeholder="Auto-calculado" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>

            {/* Avatar quality fields */}
            <div className="border border-gray-200 rounded-lg p-4 bg-amber-50">
              <p className="text-xs font-semibold text-amber-800 mb-3">🎯 Perfil de Calidad (Avatar)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-amber-700 mb-0.5">Humedad Residual (%)</label>
                  <input type="number" value={avatarHumedad} onChange={e => setAvatarHumedad(e.target.value)} step="0.1" placeholder="Ej: 12" className="w-full px-3 py-1.5 border border-amber-200 rounded text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-amber-700 mb-0.5">Temperatura (°C)</label>
                  <input type="number" value={avatarTemperatura} onChange={e => setAvatarTemperatura(e.target.value)} placeholder="Ej: 60" className="w-full px-3 py-1.5 border border-amber-200 rounded text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-amber-700 mb-0.5">Tiempo Total (horas)</label>
                  <input type="number" value={avatarTiempo} onChange={e => setAvatarTiempo(e.target.value)} step="0.5" placeholder="Ej: 8" className="w-full px-3 py-1.5 border border-amber-200 rounded text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-amber-700 mb-0.5">Grado</label>
                  <select value={avatarGrado} onChange={e => setAvatarGrado(e.target.value)} className="w-full px-3 py-1.5 border border-amber-200 rounded text-xs bg-white">
                    <option value="premium">Premium</option>
                    <option value="estandar">Estándar</option>
                    <option value="economico">Económico</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input type="text" value={batchNotes} onChange={e => setBatchNotes(e.target.value)} placeholder="Lote, operario, observaciones..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>

            {/* Preview */}
            {rawMaterial && rawQty && outputName && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-semibold text-gray-700">📋 Resumen del lote:</p>
                <p className="mt-1">{rawMaterial}: <strong>{rawQty} kg</strong></p>
                <p>→ {outputName}: <strong>{outputQty || (Number(rawQty) * 0.3).toFixed(1)} kg</strong> (estimado)</p>
                {(() => {
                  const qty = Number(outputQty) || Number(rawQty) * 0.3
                  const merma = Math.max(0, Number(rawQty) - qty)
                  const rend = ((qty / Number(rawQty)) * 100).toFixed(1)
                  const cost = costoEntrada ? Number(costoEntrada) : 0
                  const costUnit = qty > 0 && cost > 0 ? (cost / qty).toFixed(0) : null
                  return (
                    <div className="mt-1 pt-1 border-t border-gray-200 text-xs">
                      <span className="text-red-500">Merma est.: {merma.toFixed(1)} kg</span>
                      <span className={`ml-4 font-bold ${Number(rend) < 30 ? 'text-red-600' : 'text-green-600'}`}>Rendimiento est.: {rend}%</span>
                      {cost > 0 && <span className="ml-4 text-green-600">Costo: ${cost.toLocaleString()}</span>}
                      {costUnit && <span className="ml-3 text-blue-600">~${costUnit}/kg</span>}
                    </div>
                  )
                })()}
              </div>
            )}

            <button
              onClick={handleCreateBatch}
              disabled={!rawMaterial || !rawQty || !outputName}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              🏭 Iniciar Lote
            </button>
          </div>
        )}

        {/* === TAB: Lotes === */}
        {activeTab === 'lotes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-3">
              {/* Inline process creation */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">⚙️ Procesos</h3>
                <button onClick={() => setShowNewProcess(!showNewProcess)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200">+ Crear</button>
              </div>
              {showNewProcess && (
                <div className="flex gap-2">
                  <input type="text" value={newProcessName} onChange={e => setNewProcessName(e.target.value)} placeholder="Ej: Lavado" className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs" autoFocus />
                  <button onClick={handleCreateProcess} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">Ok</button>
                  <button onClick={() => { setShowNewProcess(false); setNewProcessName('') }} className="px-2 py-1.5 text-gray-400 text-xs">✕</button>
                </div>
              )}
              <div className="space-y-1 mb-3">
                {processes.filter((p: any) => p.active).map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg text-xs border border-gray-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span className="text-gray-700">{p.name}</span>
                  </div>
                ))}
                {processes.filter((p: any) => p.active).length === 0 && (
                  <p className="text-xs text-gray-400">Crea procesos para cada etapa</p>
                )}
              </div>

              <h3 className="text-sm font-semibold text-gray-700">📦 Lotes</h3>
              {loading ? <p className="text-gray-400 text-sm">Cargando...</p> : batches.length === 0 ? (
                <p className="text-gray-400 text-xs">Sin lotes aun</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {batches.filter(b => b.status !== 'cancelado').map(b => (
                    <button
                      key={b.id}
                      onClick={() => handleSelectBatch(b.id!)}
                      className={`w-full text-left p-2 rounded-lg text-xs border ${selectedBatch === b.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'} ${b.status === 'completado' ? 'opacity-60' : ''}`}
                    >
                      <div className="font-medium text-gray-800">{b.loteId}</div>
                      <div className="text-gray-500 truncate">{b.rawMaterialName} ({b.rawMaterialQty})</div>
                      <div className="text-gray-400">{b.status === 'completado' ? '✅' : b.status === 'en_proceso' ? '🔄' : '⏳'} {b.status}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              {selectedBatchData ? (
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{selectedBatchData.loteId}</h3>
                      <p className="text-xs text-gray-500">{selectedBatchData.rawMaterialName} ({selectedBatchData.rawMaterialQty} {selectedBatchData.unit})</p>
                      <p className="text-[10px] text-gray-400">{new Date(selectedBatchData.createdAt).toLocaleString()}</p>
                      {selectedBatchData.costoEntrada ? <p className="text-[10px] text-green-600">💰 ${selectedBatchData.costoEntrada.toLocaleString()}</p> : null}
                    </div>
                    <div className="flex gap-2 items-center">
                      {selectedBatchData.status === 'en_proceso' && (
                        <>
                          <button onClick={() => handleCompleteBatch(selectedBatchData.id!)} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">✅ Completar</button>
                          <button onClick={() => handleCancelBatch(selectedBatchData.id!)} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200">✕ Cancelar</button>
                        </>
                      )}
                      <button onClick={() => handleExportBatch(selectedBatchData.id!)} className="text-xs px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200" title="Exportar JSON">📤</button>
                    </div>
                  </div>

                  {/* Outputs */}
                  {selectedBatchData.status === 'completado' && batchOutputs.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                      {batchOutputs.map((bp, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border border-gray-200">
                          <p className="text-sm font-semibold text-gray-800">{bp.finalProductName}</p>
                          <div className="grid grid-cols-3 gap-1 mt-1 text-[10px]">
                            <span>Salida: <strong>{bp.finalProductQty.toFixed(2)} kg</strong></span>
                            <span className="text-red-500">Merma: <strong>{bp.wasteQty.toFixed(2)} kg</strong></span>
                            <span className="text-blue-500">Rend: <strong>{bp.rendimiento.toFixed(1)}%</strong></span>
                          </div>
                          <div className="grid grid-cols-2 text-[10px] mt-0.5">
                            <span className="text-green-600">💰 ${bp.costoUnitario.toFixed(0)}/kg</span>
                            {selectedBatchData.costoEntrada ? <span className="text-gray-500">Total: ${(selectedBatchData.costoEntrada || 0).toLocaleString()}</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Avatar quality data */}
                  {(selectedBatchData.avatarHumedad || selectedBatchData.avatarTemperatura || selectedBatchData.avatarTiempoHoras || selectedBatchData.avatarGrado) && (
                    <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-[10px] font-semibold text-amber-700 mb-1">🎯 Avatar de Calidad</p>
                      <div className="grid grid-cols-4 gap-2 text-[10px]">
                        {selectedBatchData.avatarHumedad !== undefined && <div><span className="text-gray-500">Humedad:</span> <span className="font-medium">{selectedBatchData.avatarHumedad}%</span></div>}
                        {selectedBatchData.avatarTemperatura !== undefined && <div><span className="text-gray-500">Temp:</span> <span className="font-medium">{selectedBatchData.avatarTemperatura}°C</span></div>}
                        {selectedBatchData.avatarTiempoHoras !== undefined && <div><span className="text-gray-500">Tiempo:</span> <span className="font-medium">{selectedBatchData.avatarTiempoHoras}h</span></div>}
                        {selectedBatchData.avatarGrado && <div><span className="text-gray-500">Grado:</span> <span className="font-medium capitalize">{selectedBatchData.avatarGrado}</span></div>}
                      </div>
                    </div>
                  )}

                  {/* Tandas */}
                  {(selectedBatchData.status === 'en_proceso' || tandas.length > 0) && (
                    <div className="mb-3">
                      {selectedBatchData.status === 'en_proceso' && (
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-semibold text-gray-600">📋 Tandas de producción</p>
                          <button onClick={() => setShowNewTanda(!showNewTanda)} className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200">➕ Nueva Tanda</button>
                        </div>
                      )}
                      {tandas.length === 0 && selectedBatchData.status === 'en_proceso' && (
                        <p className="text-[10px] text-gray-400">Aun no hay tandas. Crea una para empezar.</p>
                      )}
                      {showNewTanda && (
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2 mb-2">
                          <p className="text-xs font-semibold text-indigo-700">Nueva Tanda</p>
                          <div className="flex gap-2">
                            <input type="number" value={newTandaQty} onChange={e => setNewTandaQty(e.target.value)} placeholder="Cantidad entrada (kg)" className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-xs" />
                            <select value={newTandaResource} onChange={e => setNewTandaResource(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded text-xs">
                              <option value="">Sin recurso</option>
                              {resources.filter(r => r.type !== 'OPERARIO').map(r => (
                                <option key={r.id} value={r.id}>{r.type === 'HORNO' ? '🔥' : r.type === 'AREA' ? '🏭' : '🔧'} {r.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => { setShowNewTanda(false); setNewTandaQty(''); setNewTandaResource('') }} className="px-2 py-1 text-xs text-gray-500">Cancelar</button>
                            <button onClick={handleCreateTanda} disabled={!newTandaQty} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 disabled:bg-gray-300">Crear Tanda</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Steps grouped by tanda */}
                  {(() => {
                    if (steps.length === 0) {
                      return <p className="text-gray-400 text-sm text-center py-4">Crea procesos y tandas para empezar</p>
                    }
                    // Agrupar steps por runId
                    const runIds = [...new Set(steps.map(s => s.runId))].sort()
                    const hasMultipleRuns = tandas.length > 1
                    return runIds.map(runId => {
                      const runSteps = steps.filter(s => s.runId === runId).sort((a, b) => a.sortOrder - b.sortOrder)
                      const tanda = tandas.find(t => t.id === runId)
                      // Fallback: si no hay tandas, renderizar steps igual
                      if (!tanda) {
                        return (
                          <div key={runId} className="mb-3 border border-gray-200 rounded-lg p-2">
                            {hasMultipleRuns && <p className="text-[10px] font-semibold text-gray-500 mb-1">Flujo #{runId}</p>}
                            <div className="space-y-1.5">
                              {runSteps.map((s, i) => {
                                const dur = calcDuration(s.startTime, s.endTime)
                                const isActive = s.status === 'en_progreso'
                                const isDone = s.status === 'completado'
                                const isPending = s.status === 'pendiente'
                                const canInteract = selectedBatchData.status === 'en_proceso'
                                const waste = s.wasteQty !== undefined ? s.wasteQty : (s.weightIn !== undefined && s.weightOut !== undefined ? Math.max(0, s.weightIn - s.weightOut) : undefined)
                                return (
                                  <div key={s.id} className={`rounded-lg border p-3 ${isActive ? 'border-blue-400 bg-blue-50' : isDone ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                          {isDone ? '✓' : hasMultipleRuns ? `${runId}.${i + 1}` : i + 1}
                                        </span>
                                        <div>
                                          <span className="font-semibold text-sm text-gray-800">{s.processName}</span>
                                          <div className="text-[10px] text-gray-400">
                                            {isDone && <span className="text-green-600">✅ Completado</span>}
                                            {isActive && <span className="text-blue-600">▶ En progreso</span>}
                                            {isPending && <span className="text-gray-400">⏳ Pendiente</span>}
                                            {dur && <span className="ml-2">⏱ {dur}</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        {isDone ? (
                                          <span className="text-xs text-gray-400">{formatTime(s.startTime)}-{formatTime(s.endTime)}</span>
                                        ) : isActive ? (
                                          <button onClick={() => { setStepModal({ step: s, action: 'complete' }); setStepWeightIn(s.weightIn?.toString() || ''); setStepWeightOut(''); setStepObservations(s.observations || ''); setStepOperator(s.operatorId?.toString() || ''); setStepResource(s.resourceId?.toString() || '') }}
                                            className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">✔ Finalizar</button>
                                        ) : canInteract ? (
                                          <button onClick={() => { setStepModal({ step: s, action: 'start' }) }}
                                            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">▶ Iniciar</button>
                                        ) : null}
                                      </div>
                                    </div>
                                    {(s.weightIn !== undefined || s.weightOut !== undefined || waste !== undefined || s.observations || s.resourceName || s.operatorId) && (
                                      <div className="mt-2 text-[10px] text-gray-500 border-t border-gray-200 pt-1 flex flex-wrap gap-x-3">
                                        {s.weightIn !== undefined && <span>Ent: <strong>{s.weightIn} kg</strong></span>}
                                        {s.weightOut !== undefined && <span>Sal: <strong>{s.weightOut} kg</strong></span>}
                                        {waste !== undefined && <span className="text-red-500">Merma: <strong>{waste.toFixed(2)} kg</strong></span>}
                                        {s.resourceName && <span>🔧 {s.resourceName}</span>}
                                        {s.operatorId && <span>👤 Op#{s.operatorId}</span>}
                                        {s.observations && <span>📝 {s.observations}</span>}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      }
                      const tandaNombre = tanda.nombre || `Tanda ${runId}`
                      const tandaStatus = tanda.estado || 'activo'
                      const tandaColor = tandaStatus === 'completado' ? 'border-green-300 bg-green-50/30' : 'border-indigo-200'
                      return (
                        <div key={runId} className={`mb-3 border rounded-lg p-2 ${tandaColor}`}>
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${tandaStatus === 'completado' ? 'text-green-600' : 'text-indigo-600'}`}>
                                {tandaNombre} {tandaStatus === 'completado' ? '✅' : tanda.recursoAsignado ? `(${tanda.cantidadEntrada}kg → 🔧 ${tanda.recursoAsignado})` : `(${tanda.cantidadEntrada}kg)`}
                              </span>
                            </div>
                            {tandaStatus === 'activo' && selectedBatchData.status === 'en_proceso' && (
                              <button onClick={() => handleCompleteTanda(tanda.id!)} className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold hover:bg-green-200">Cerrar Tanda</button>
                            )}
                          </div>
                          {tanda.observaciones && <p className="text-[10px] text-gray-400 mb-1">📝 {tanda.observaciones}</p>}
                          <div className="space-y-1.5">
                            {runSteps.map((s, i) => {
                              const dur = calcDuration(s.startTime, s.endTime)
                              const isActive = s.status === 'en_progreso'
                              const isDone = s.status === 'completado'
                              const isPending = s.status === 'pendiente'
                              const canInteract = selectedBatchData.status === 'en_proceso'
                              const waste = s.wasteQty !== undefined ? s.wasteQty : (s.weightIn !== undefined && s.weightOut !== undefined ? Math.max(0, s.weightIn - s.weightOut) : undefined)
                              return (
                                <div key={s.id} className={`rounded-lg border p-3 ${isActive ? 'border-blue-400 bg-blue-50' : isDone ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {isDone ? '✓' : hasMultipleRuns ? `${runId}.${i + 1}` : i + 1}
                                      </span>
                                      <div>
                                        <span className="font-semibold text-sm text-gray-800">{s.processName}</span>
                                        <div className="text-[10px] text-gray-400">
                                          {isDone && <span className="text-green-600">✅ Completado</span>}
                                          {isActive && <span className="text-blue-600">▶ En progreso</span>}
                                          {isPending && <span className="text-gray-400">⏳ Pendiente</span>}
                                          {dur && <span className="ml-2">⏱ {dur}</span>}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      {isDone ? (
                                        <span className="text-xs text-gray-400">{formatTime(s.startTime)}-{formatTime(s.endTime)}</span>
                                      ) : isActive ? (
                                        <button onClick={() => { setStepModal({ step: s, action: 'complete' }); setStepWeightIn(s.weightIn?.toString() || ''); setStepWeightOut(''); setStepObservations(s.observations || ''); setStepOperator(s.operatorId?.toString() || ''); setStepResource(s.resourceId?.toString() || '') }}
                                          className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">✔ Finalizar</button>
                                      ) : canInteract ? (
                                        <button onClick={() => { setStepModal({ step: s, action: 'start' }) }}
                                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">▶ Iniciar</button>
                                      ) : null}
                                    </div>
                                  </div>
                                  {(s.weightIn !== undefined || s.weightOut !== undefined || waste !== undefined || s.observations || s.resourceName || s.operatorId) && (
                                    <div className="mt-2 text-[10px] text-gray-500 border-t border-gray-200 pt-1 flex flex-wrap gap-x-3">
                                      {s.weightIn !== undefined && <span>Ent: <strong>{s.weightIn} kg</strong></span>}
                                      {s.weightOut !== undefined && <span>Sal: <strong>{s.weightOut} kg</strong></span>}
                                      {waste !== undefined && <span className="text-red-500">Merma: <strong>{waste.toFixed(2)} kg</strong></span>}
                                      {s.resourceName && <span>🔧 {s.resourceName}</span>}
                                      {s.operatorId && <span>👤 Op#{s.operatorId}</span>}
                                      {s.observations && <span>📝 {s.observations}</span>}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg mb-1">Selecciona un lote</p>
                  <p className="text-xs">o crea uno nuevo</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === TAB: Estadisticas === */}
        {activeTab === 'stats' && (
          <div>
            {history.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Sin datos de produccion aun</p>
            ) : (
              <div className="space-y-4">
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Total Lotes</p>
                    <p className="text-xl font-bold text-gray-800">{dashboard?.totalBatches || 0}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Tiempo Promedio</p>
                    <p className="text-xl font-bold text-blue-600">{avgBatchTime === '—' ? '—' : `${avgBatchTime} min`}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Merma Global</p>
                    <p className="text-xl font-bold text-red-600">{globalWastePct}%</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Rendimiento Prom.</p>
                    <p className="text-xl font-bold text-green-600">{dashboard?.avgRendimiento.toFixed(1) || '0'}%</p>
                  </div>
                </div>

                {/* Per-product stats */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📊 Por Producto Final</h3>
                  {(() => {
                    const perProduct: Record<string, { batches: number; totalQty: number; totalWaste: number; rendimientos: number[] }> = {}
                    for (const p of history) {
                      if (!perProduct[p.finalProductName]) perProduct[p.finalProductName] = { batches: 0, totalQty: 0, totalWaste: 0, rendimientos: [] }
                      perProduct[p.finalProductName].batches++
                      perProduct[p.finalProductName].totalQty += p.finalProductQty
                      perProduct[p.finalProductName].totalWaste += p.wasteQty
                      perProduct[p.finalProductName].rendimientos.push(p.rendimiento)
                    }
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Object.entries(perProduct).map(([name, stats]) => {
                          const avgRend = stats.rendimientos.reduce((a, b) => a + b, 0) / stats.rendimientos.length
                          return (
                            <div key={name} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <p className="font-semibold text-sm text-gray-800">{name}</p>
                              <div className="grid grid-cols-2 gap-1 mt-1 text-[10px]">
                                <span>Lotes: {stats.batches}</span>
                                <span>Total: {stats.totalQty.toFixed(1)}</span>
                                <span className="text-red-500">Merma: {stats.totalWaste.toFixed(1)}</span>
                                <span className="text-blue-500">Rend: {avgRend.toFixed(1)}%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

                {/* Process/oven stats */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">⚙️ Por Proceso</h3>
                  {(() => {
                    // Get unique process names from all completed batches
                    const procStats: Record<string, { count: number; totalTime: number; statuses: string[] }> = {}
                    // For simplicity, we show process names from the current batch steps
                    for (const s of steps) {
                      if (!procStats[s.processName]) procStats[s.processName] = { count: 0, totalTime: 0, statuses: [] }
                      procStats[s.processName].count++
                      procStats[s.processName].statuses.push(s.status)
                      if (s.startTime && s.endTime) {
                        procStats[s.processName].totalTime += new Date(s.endTime).getTime() - new Date(s.startTime).getTime()
                      }
                    }
                    return Object.keys(procStats).length === 0 ? (
                      <p className="text-xs text-gray-400">Abre un lote para ver estadisticas de procesos</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Object.entries(procStats).map(([name, stats]) => {
                          const avgTime = stats.count > 0 ? (stats.totalTime / stats.count / 60000).toFixed(1) : '—'
                          const completed = stats.statuses.filter(s => s === 'completado').length
                          return (
                            <div key={name} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <p className="font-semibold text-sm text-gray-800">{name}</p>
                              <div className="grid grid-cols-2 gap-1 mt-1 text-[10px]">
                                <span>Ejecuciones: {stats.count}</span>
                                <span>Completados: {completed}</span>
                                <span className="text-blue-500">Tiempo prom: {avgTime === '—' ? '—' : `${avgTime} min`}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

                {/* Full history table */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Historial Completo</h3>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Lote</th>
                          <th className="p-2 text-left">Entrada</th>
                          <th className="p-2 text-left">Salida</th>
                          <th className="p-2 text-right">Cant.</th>
                          <th className="p-2 text-right">Merma</th>
                          <th className="p-2 text-right">Rend.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(prod => (
                          <tr key={prod.id || prod.loteId + prod.finalProductName} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="p-2 font-medium">{prod.loteId}</td>
                            <td className="p-2">{prod.rawMaterialName}</td>
                            <td className="p-2">{prod.finalProductName}</td>
                            <td className="p-2 text-right">{prod.finalProductQty}</td>
                            <td className="p-2 text-right text-red-500">{prod.wasteQty.toFixed(1)}</td>
                            <td className="p-2 text-right">
                              <span className={`${prod.rendimiento >= 30 ? 'text-green-600' : 'text-red-600'}`}>{prod.rendimiento.toFixed(1)}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step Modals */}
      {stepModal && stepModal.action === 'start' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setStepModal(null)}>
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-4">▶ Iniciar: {stepModal.step.processName}</h3>
            <p className="text-xs text-gray-500 mb-3">Se registrara la hora de inicio automaticamente.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Peso entrada (kg)</label>
                <input type="number" value={stepWeightIn} onChange={e => setStepWeightIn(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Recurso</label>
                <select value={stepResource} onChange={e => setStepResource(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Sin recurso</option>
                  {resources.filter(r => r.type !== 'OPERARIO').map(r => (
                    <option key={r.id} value={r.id}>{r.type === 'HORNO' ? '🔥' : r.type === 'AREA' ? '🏭' : '🔧'} {r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Operario</label>
                <select value={stepOperator} onChange={e => setStepOperator(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Sin asignar</option>
                  {operarios.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleStartStep} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700">Iniciar</button>
              <button onClick={() => setStepModal(null)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {stepModal && stepModal.action === 'complete' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setStepModal(null)}>
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-4">✔ Finalizar: {stepModal.step.processName}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Peso entrada (kg)</label>
                  <input type="number" value={stepWeightIn} onChange={e => setStepWeightIn(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Peso salida (kg) <span className="text-red-500">*</span>
                  </label>
                  <input type="number" value={stepWeightOut} onChange={e => setStepWeightOut(e.target.value)} placeholder="Requerido" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
              </div>
              {/* Waste preview */}
              {stepWeightIn && stepWeightOut && (
                <div className="p-2 bg-gray-50 rounded text-[10px]">
                  <span>Merma: <strong className="text-red-500">{Math.max(0, Number(stepWeightIn) - Number(stepWeightOut)).toFixed(2)} kg</strong></span>
                  <span className="ml-3">Rend: <strong className="text-blue-500">{((Number(stepWeightOut) / Number(stepWeightIn)) * 100).toFixed(1)}%</strong></span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Recurso</label>
                  <select value={stepResource} onChange={e => setStepResource(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">Sin recurso</option>
                    {resources.filter(r => r.type !== 'OPERARIO').map(r => (
                      <option key={r.id} value={r.id}>{r.type === 'HORNO' ? '🔥' : r.type === 'AREA' ? '🏭' : '🔧'} {r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Operario</label>
                  <select value={stepOperator} onChange={e => setStepOperator(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">Sin asignar</option>
                    {operarios.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones</label>
                <input type="text" value={stepObservations} onChange={e => setStepObservations(e.target.value)} placeholder="Tiempo, temperatura, notas..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCompleteStep} disabled={!stepWeightOut} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed">Finalizar</button>
              <button onClick={() => setStepModal(null)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
