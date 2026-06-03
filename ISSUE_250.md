# #250 — Módulo Producción Unificado: Estadísticas, Multi-Producto, Exportación

## Estado: ⏳ EN PRUEBAS (NO CERRAR)

---

## Requisitos Funcionales

### RF1 — Creación rápida de lote
- [ ] El usuario selecciona una materia prima del inventario
- [ ] Ingresa cantidad de entrada
- [ ] Escribe el nombre del producto final (si no existe, se crea automáticamente tipo `producto_final`)
- [ ] Ingresa cantidad obtenida estimada
- [ ] El sistema muestra preview con merma estimada y rendimiento estimado
- [ ] Al crear, se inicia automáticamente el lote con estado `en_proceso`

### RF2 — Procesos inline
- [ ] El usuario puede crear procesos (etapas de producción) sin salir de la pantalla
- [ ] Los procesos creados se asignan automáticamente a nuevos lotes
- [ ] Múltiples procesos pueden estar `en_progreso` simultáneamente (paralelo)
- [ ] Cada proceso registra tiempo de inicio/fin, pesos, operario

### RF3 — Transformación de inventario
- [ ] Al completar un lote:
  - [ ] Se descuenta la materia prima del inventario
  - [ ] Se suma el producto final al inventario
  - [ ] Se calcula merma por producto
  - [ ] Se calcula rendimiento por producto
  - [ ] Se calcula costo unitario por producto
  - [ ] Se registra transacción de producción

### RF4 — Estadísticas y dashboard
- [ ] Dashboard muestra: total producido, merma total, rendimiento promedio, cantidad de lotes, merma global %
- [ ] Tab "Estadísticas" muestra:
  - [ ] KPIs: total lotes, tiempo promedio, merma global, rendimiento promedio
  - [ ] Por producto final: lotes, total producido, merma, rendimiento
  - [ ] Por proceso (horno, lavado, etc.): ejecuciones, completados, tiempo promedio
  - [ ] Tabla historial completo con lote, entrada, salida, cantidad, merma, rendimiento

### RF5 — Exportación de datos
- [ ] Botón "Exportar CSV" en estadísticas: descarga todo el historial
- [ ] Botón "📤" por lote: descarga JSON detallado del lote (productos, pasos, tiempos)

### RF6 — Soporte multi-producto
- [ ] Un lote puede tener múltiples productos finales (1 materia prima → N salidas)
- [ ] Cada producto final tiene su propia merma, rendimiento y costo unitario
- [ | ] Versión simplificada: 1 entrada → 1 salida (suficiente para deshidratados v1)

---

## Requisitos No Funcionales

### RNF1 — Persistencia
- [ ] Todos los datos de producción deben persistir en IndexedDB
- [ ] Sincronización con filesystem cuando se ejecuta en Electron (auto-save)

### RNF2 — Rendimiento
- [ ] Dashboard debe cargar en < 2s incluso con 1000+ lotes
- [ ] La creación de lote debe ser instantánea (< 500ms)

### RNF3 — UX
- [ ] La pantalla de producción debe ser una sola (no 3 pantallas separadas)
- [ ] Botón 🏭 visible en el header para todos los tipos de negocio
- [ ] Feedback visual inmediato al crear/completar lote

### RNF4 — Integridad de datos
- [ ] Al completar un lote, la transformación de inventario debe ser atómica
- [ ] Si falla la actualización de un producto, no debe quedar inventario inconsistente

### RNF5 — Compatibilidad
- [ ] Debe funcionar en navegador web (sin Electron)
- [ ] Debe funcionar en modo offline (PWA + IndexedDB)

---

## Pruebas Pendientes

- [ ] **P1**: Crear materia prima "Piña" (stock 10) y producto final "Piña Deshidratada" (stock 0)
- [ ] **P2**: Crear proceso "Lavado" y "Horno 1"
- [ ] **P3**: Crear lote: Piña(10) → Piña Deshidratada(7)
- [ ] **P4**: Iniciar proceso Lavado, completarlo
- [ ] **P5**: Iniciar proceso Horno 1, completarlo
- [ ] **P6**: Completar lote → verificar: Piña stock 0, Piña Deshidratada stock 7
- [ ] **P7**: Verificar estadísticas: rendimiento, merma, costo
- [ ] **P8**: Exportar CSV desde estadísticas
- [ ] **P9**: Exportar JSON de un lote individual
- [ ] **P10**: Verificar que el 🏭 botón funciona desde cualquier tipo de negocio
- [ ] **P11**: Verificar que el producto final se crea auto si no existe
