# #250 — Módulo Producción Unificado: Estadísticas, Multi-Producto, Exportación

## Estado: ✅ COMPLETADO — Pendiente de cierre por confirmación del usuario

---

## Requisitos Funcionales

### RF1 — Creación rápida de lote
- [x] El usuario selecciona una materia prima del inventario
- [x] Ingresa cantidad de entrada
- [x] Escribe el nombre del producto final (si no existe, se crea automáticamente tipo `producto_final`)
- [x] Ingresa cantidad obtenida estimada
- [x] El sistema muestra preview con merma estimada y rendimiento estimado
- [x] Al crear, se inicia automáticamente el lote con estado `en_proceso`

### RF2 — Procesos inline
- [x] El usuario puede crear procesos (etapas de producción) sin salir de la pantalla
- [x] Los procesos creados se asignan automáticamente a nuevos lotes
- [x] Múltiples procesos pueden estar `en_progreso` simultáneamente (paralelo)
- [x] Cada proceso registra tiempo de inicio/fin, pesos, operario

### RF3 — Transformación de inventario
- [x] Al completar un lote:
  - [x] Se descuenta la materia prima del inventario
  - [x] Se suma el producto final al inventario
  - [x] Se calcula merma por producto
  - [x] Se calcula rendimiento por producto
  - [x] Se calcula costo unitario por producto
  - [x] Se registra transacción de producción

### RF4 — Estadísticas y dashboard
- [x] Dashboard muestra: total producido, merma total, rendimiento promedio, cantidad de lotes, merma global %
- [x] Tab "Estadísticas" muestra:
  - [x] KPIs: total lotes, tiempo promedio, merma global, rendimiento promedio
  - [x] Por producto final: lotes, total producido, merma, rendimiento
  - [x] Por proceso (horno, lavado, etc.): ejecuciones, completados, tiempo promedio
  - [x] Tabla historial completo con lote, entrada, salida, cantidad, merma, rendimiento

### RF5 — Exportación de datos
- [x] Botón "Exportar CSV" en estadísticas: descarga todo el historial
- [x] Botón "📤" por lote: descarga JSON detallado del lote (productos, pasos, tiempos)

### RF6 — Soporte multi-producto
- [x] Un lote puede tener múltiples productos finales (1 materia prima → N salidas)
- [x] Cada producto final tiene su propia merma, rendimiento y costo unitario
- [x] UI con lista dinámica de productos (agregar/eliminar)

---

## Requisitos No Funcionales

### RNF1 — Persistencia
- [x] Todos los datos de producción deben persistir en IndexedDB
- [x] Sincronización con filesystem cuando se ejecuta en Electron (auto-save)

### RNF2 — Rendimiento
- [x] Dashboard debe cargar en < 2s incluso con 1000+ lotes
- [x] La creación de lote debe ser instantánea (< 500ms)

### RNF3 — UX
- [x] La pantalla de producción debe ser una sola (no 3 pantallas separadas)
- [x] Botón 🏭 accesible desde menú "Más" (no header)
- [x] Feedback visual inmediato al crear/completar lote

### RNF4 — Integridad de datos
- [x] Al completar un lote, la transformación de inventario debe ser atómica
- [x] Si falla la actualización de un producto, no debe quedar inventario inconsistente

### RNF5 — Compatibilidad
- [x] Debe funcionar en navegador web (sin Electron)
- [x] Debe funcionar en modo offline (PWA + IndexDB)

---

## Pruebas

- [x] **P1-P11**: 13 tests automatizados (production-flow.test.ts) que cubren ciclo completo
- [x] **P2**: Crear proceso "Lavado" y "Horno 1" — cubierto por tests
- [x] **P3**: Crear lote: Piña(10) → Piña Deshidratada(7)
- [x] **P6**: Completar lote → verificar inventario transformado
- [x] **P7**: Verificar estadísticas: rendimiento, merma, costo
- [x] **P8-P9**: Exportación CSV/JSON
- [x] **P10**: Botón 🏭 removido del header, accesible desde "Más"
- [x] **P11**: Producto final se crea auto si no existe
