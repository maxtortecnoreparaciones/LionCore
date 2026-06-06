# LionCore POS — Agent Context

## Architecture
- **Stack**: React + TypeScript + Vite + Tailwind CSS v4 + Dexie.js (IndexedDB)
- **Build**: `npm run build` (tsc + vite build) / `npm run dev` (vite dev)
- **Desktop**: Electron via `npm run electron:dev` / `npm run electron:build`
- **Offline-first**: PWA Service Worker (`public/sw.js`) + IndexedDB
- **Testing**: Vitest + jsdom + fake-indexeddb — `npm test` (14 tests)
- **Persistencia**: Auto-save cada 5min + beforeunload en Electron, backups en `%APPDATA%/LionCore/LionCoreData/`, copia automática a Google Drive si está instalado

## Business Types
5 tipos en `src/services/db.ts` (`businessTemplates`): `pos`, `deshidratados`, `restaurante`, `fruver`, `service_store`. Cada uno define `unidad`, `showProduccion`, `showGastos`, `showCompra`, `label`, `emoji`.

## Key Files
- `src/App.tsx` (~2523 lines) — UI principal con todos los módulos integrados (refactorizado: Header, 6 modales, TransactionForm, 8 vistas extraídos)
- `src/services/db.ts` — DB schema v15, CRUD, business logic (~2428 lines)
- `src/services/license.ts` — Validación Google Sheet, DeviceId, plan FREE/PRO, offline 72h
- `src/services/registration.ts` — Registro de usuarios vía Google Apps Script webhook
- `src/services/registration.gs` — Código Google Apps Script para desplegar como Web App
- `src/services/persistence.ts` — Persistencia Electron: syncSave, syncLoad, backups, export
- `electron/main.js` — Electron entry: inicia Express server en puerto 3456, luego loadURL
- `electron/server.js` — Express API (mesas, pedidos, WebSocket, persistencia, QR, backups, Google Drive)
- `src/components/views/` — 11 vistas extraídas (History, Summary, Config, Inventory, Fruver, Services, Warehouses, ProcessConfig, ProcessExecution, Resources, Customers, Suppliers)
- `src/utils/format.ts` — formatCOP, formatDate, getTypeStyle
- `docs/persistencia-backups.md` — Documentación de persistencia y backups
- `tests/persistence.test.ts` — Tests unitarios persistencia (5 tests)
- `tests/server-persistence.test.ts` — Tests integración servidor Express (9 tests)

## Database Schema (v15)
Tables: `businesses`, `products`, `transactions`, `transaction_items`, `transaction_meta`, `inventory_adjustments`, `productions`, `service_orders`, `customers`, `mesas`, `warehouses`, `warehouse_stock`, `production_processes`, `production_batches`, `batch_step_logs`, `production_resources`, `batch_products`, `production_batch_runs`.

## License & Plans
- **FREE**: Ventas + Exportar + Inventario + Producción (deshidratados)
- **PRO**: Todas las funciones (compra, gastos, config)
- Activación: email + Google Sheet (columna "Licencias") o registro nuevo
- Offline grace: 72h desde último check online

## Registration Flow (#118)
1. Banner "Registrarse" → modal con nombre, email, negocio, tipo
2. POST a Google Apps Script webhook (no-cors fallback GET)
3. Webhook escribe en sheet "Registros" y auto-agrega licencia FREE 1 año en "Licencias"
4. App guarda `saveLicenseState({ plan: 'free', isActivated: true })` localmente
5. Recarga → usuario tiene FREE activo

## GitHub Issues
- **Closed (implementados)**: #43-#50, #55, #57-#61, #63-#65, #69, #87-#96, #111-#122, #123-#126, #250
- **Implementados**: #242 (persistencia Electron + auto-save + backups + tests), #249 (flujo producción unificado), #251 (tandas de producción), #258 (Inventario Express), #259 (Variantes Automáticas), #260 (Ubicaciones Físicas)
- **Pendiente cierre**: #250 (RF6 multi-producto implementado, esperando confirmación usuario), #258, #259, #260

## Issues Abiertos
- (ninguno — todos implementados, pendientes de cierre por confirmación)

## Common Commands
```bash
npm run build          # Build production
npm run dev            # Dev server
npm run electron:dev   # Electron dev (Vite + Express)
npm run electron:build # Build Windows .exe portable
npm test               # 14 tests (vitest)
```

## Build Warnings
- `[INEFFECTIVE_DYNAMIC_IMPORT]` — cosmético, db.ts importado estática y dinámicamente
- `[PLUGIN_TIMINGS]` — cosmético, Tailwind generate timing

## Known Issues / Edge Cases
- **Registration**: Google Apps Script POST puede fallar por CORS; `no-cors` fallback GET intenta registrar igual
- **Profit Blur**: Se aplica a usuarios FREE y no activados; overlay "Actualiza a PRO" dirige a modal de licencia
- **Margin auto-calc**: Precio se recalcula automáticamente al cambiar costo o margen; ambos formularios (nuevo/editar producto)
- **Inventory History**: Carga todos los ajustes del negocio actual, filtro por nombre de producto

## Electron Server
- `electron/server.js` (108 líneas) tiene API REST + WebSocket + QR endpoint
- Puerto 3456, accesible desde la red local (`0.0.0.0`)
- Endpoints: `GET /api/mesas`, `POST /api/mesas/:id/pedidos`, `GET /api/pedidos`, `POST /api/pedidos/:id/estado`, `GET /api/ip`
- WebSocket: broadcast de actualizaciones en tiempo real (pedido_nuevo, pedido_actualizado)
- Catch-all SPA: `/{*path}` sirve dist/index.html (incluye `/waiter`, `/kitchen`)
- EN producción: Electron carga `http://localhost:3456` (no loadFile)
- Datos en memoria (no persistidos en servidor, solo en IndexedDB del cliente)

## URL Routing (SPA)
- App.tsx detecta `window.location.pathname` para rutas especiales:
  - `/waiter` → RestaurantModule full-screen (sin header/nav/FAB) para meseros en celular
  - `/kitchen` → CocinaView full-screen para cocina, con botón "Notifica al mesero" en vez de cobrar
  - `/` → App completa normal (POS, config, views, etc.)
- Express catch-all `/{*path}` sirve `dist/index.html` para todas las rutas; React maneja el routing interno

## Cocina Status Flow
- Cada item de orden tiene status: `pendiente` (default) → `preparando` → `listo`
- CocinaView muestra badges de color y botones para avanzar estados
- `setOrderItemStatus(mesaId, itemIndex, status)` en db.ts
