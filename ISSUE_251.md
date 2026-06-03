# #251 — Introducir concepto de Tanda de Producción

## Prioridad: P0 — Crítico

## Problema

Un lote de 100kg de fresa no entra completo a un horno. Debe dividirse en tandas:

```
Lote: 100kg Fresa
  ├── Tanda 1 → 10kg → Horno #1
  ├── Tanda 2 → 20kg → Horno #2
  ├── Tanda 3 → 20kg → Horno #1
  ├── Tanda 4 → 25kg → Horno #3
  └── Tanda 5 → 25kg → Horno #2
```

## Implementado

### DB Schema v15
- **`production_batch_runs`**: `++id, batchId, estado, createdAt`
- **`ProductionBatchRun`** interface con campos: `id, batchId, nombre, cantidadEntrada, estado, recursoAsignado, recursoId, fechaInicio, fechaFin, observaciones, createdAt`
- Migración v15: crea `ProductionBatchRun` default para lotes existentes con steps

### Funciones CRUD (`db.ts`)
- `getBatchRuns(batchId)` — obtiene tandas de un lote
- `createBatchRun(batchId, cantidadEntrada, recursoId?, recursoName?)` — crea tanda + sus steps
- `completeBatchRun(runId)` — cierra tanda con fechaFin
- `createUnifiedBatch()` ahora crea **Tanda 1** automáticamente al crear el lote

### UI (`ProcessExecutionView.tsx`)
- **📋 Tandas de producción** sección en detalle del lote
- **➕ Nueva Tanda** botón + formulario inline (cantidad entrada + recurso)
- Steps agrupados por tanda (cada tanda con sus pasos independientes)
- **Cerrar Tanda** botón por tanda individual (el lote permanece abierto)
- Tandas completadas se muestran en verde con ✅

## Reglas
- ✅ Un lote puede tener muchas tandas
- ✅ Una tanda pertenece a un solo lote
- ✅ Una tanda ejecuta los pasos del proceso
- ✅ Cada tanda tiene su propio recurso (horno)
- ✅ Cerrar tanda no cierra el lote

## Pruebas Pendientes
- [ ] TEST 1: Crear lote → ver Tanda 1 creada automáticamente
- [ ] TEST 2: Crear 5 tandas dentro del lote con diferentes cantidades
- [ ] TEST 3: Asignar horno diferente a cada tanda
- [ ] TEST 4: Cerrar tanda individual → verificar lote sigue abierto
- [ ] TEST 5: Persistencia después de reiniciar
- [ ] TEST 6: Verificar steps por tanda se ejecutan independientemente
