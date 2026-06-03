# Persistencia, Auto-Save y Backups

## 1. Arquitectura General

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Renderer)                          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  IndexedDB (Dexie.js)                                         │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │  19 tablas: products, transactions, batch_products, ...  │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                           │ syncSave() / syncLoad()                   │
│                           ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  src/services/persistence.ts                                  │  │
│  │  · getExportableCollections() → extrae las 19 tablas          │  │
│  │  · importCollections() → restaura desde JSON a IndexedDB      │  │
│  │  · syncSave() → POST a servidor local                         │  │
│  │  · syncLoad() → GET desde servidor local                      │  │
│  │  · createBackup() → syncSave + backup en servidor             │  │
│  │  · restoreBackup() → restaura backup + syncLoad               │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────┬───────────────────────────┘
                    HTTP :3456            │
                    POST/GET              │
                    /api/persistence/*     │
┌──────────────────────────────────────────▼───────────────────────────┐
│                        SERVIDOR (Electron main)                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  electron/server.js                                          │  │
│  │  · app.post('/api/persistence/save')   → guarda a disco      │  │
│  │  · app.get('/api/persistence/load')    → lee de disco        │  │
│  │  · app.post('/api/persistence/backup') → backup completo     │  │
│  │  · app.get('/api/persistence/backups') → lista backups       │  │
│  │  · app.post('/api/persistence/restore')→ restaura backup     │  │
│  │  · app.get('/api/persistence/verify')  → integridad JSON     │  │
│  │  · app.get('/api/persistence/export')  → exportación única   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                           ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  DISCO (userData)                                             │  │
│  │  C:/Users/<user>/AppData/Roaming/LionCore/LionCoreData/       │  │
│  │  ├── database/    → 19 archivos .json (1 por tabla)          │  │
│  │  ├── backups/     → backup-YYYY-MM-DD-<timestamp>.json        │  │
│  │  ├── config/      → configuraciones                           │  │
│  │  ├── licenses/    → datos de licencia                         │  │
│  │  └── exports/     → export-<timestamp>.json                   │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## 2. Flujo de Auto-Save (en App.tsx)

```typescript
// Se activa solo en modo Electron (detección vía /api/persistence/status)
useEffect(() => {
  const electron = await isElectron()
  if (!electron) return

  // 1. Guardado inmediato al abrir la app
  syncSave()

  // 2. Guardado automático cada 5 minutos
  setInterval(syncSave, 5 * 60 * 1000)

  // 3. Guardado al cerrar la app (beforeunload)
  window.addEventListener('beforeunload', syncSave)
}, [])
```

### Comportamiento
- **Inicio**: Se guarda todo al cargar la app
- **Cada 5 min**: Auto-save silencioso
- **Cierre**: `beforeunload` dispara syncSave (se ejecuta incluso si la ventana se cierra)
- **Web mode**: No hace nada (solo aplica en Electron)

## 3. Dónde se Guarda (Ruta en Disco)

| Variable | Ruta típica |
|----------|-------------|
| `DATA_ROOT` | `%APPDATA%/LionCore/LionCoreData/` |
| `database/` | `.../LionCoreData/database/products.json` |
| `backups/` | `.../LionCoreData/backups/backup-2026-05-28-1712345678.json` |
| `exports/` | `.../LionCoreData/exports/export-1712345678.json` |

**Fallback**: Si `electron.app.getPath('userData')` falla, usa `.lioncore_data/` en la raíz del proyecto.

### Ejemplo de archivo en database/:
```json
// products.json
[
  { "id": 1, "name": "Papa", "businessId": 1, "price": 2000, "unit": "kg" },
  { "id": 2, "name": "Yuca", "businessId": 1, "price": 1500, "unit": "kg" }
]
```

Cada tabla de IndexedDB se guarda como un archivo JSON independiente. Las 19 tablas son:

| Archivo | Contenido |
|---------|-----------|
| `products.json` | Productos del negocio |
| `transactions.json` | Transacciones (ventas) |
| `transaction_items.json` | Items de cada transacción |
| `transaction_meta.json` | Metadatos de transacciones |
| `inventory_adjustments.json` | Ajustes de inventario |
| `productions.json` | Producciones (legacy) |
| `customers.json` | Clientes |
| `suppliers.json` | Proveedores |
| `categories.json` | Categorías |
| `mesas.json` | Mesas (restaurante) |
| `production_processes.json` | Procesos de producción |
| `production_batches.json` | Lotes de producción |
| `batch_step_logs.json` | Pasos de producción |
| `production_resources.json` | Recursos (hornos, áreas) |
| **`batch_products.json`** | Materia prima usada por lote |
| **`production_batch_runs.json`** | Tandas de producción |
| `service_orders.json` | Órdenes de servicio técnico |
| `warehouses.json` | Bodegas |
| `warehouse_stock.json` | Stock por bodega |

## 4. Backups

### Creación manual
```typescript
const result = await createBackup()
// → { ok: true, backup: "backup-2026-05-28-1712345678", path: "..." }
```

### Flujo del backup
1. `createBackup()` llama a `syncSave()` para asegurar datos frescos en disco
2. Lee los 19 archivos de `database/`
3. Los agrupa en un solo JSON con metadatos
4. Guarda en `backups/backup-YYYY-MM-DD-<timestamp>.json`
5. **Retención**: conserva solo los últimos **30 backups**, elimina los más antiguos

### Ejemplo de archivo backup:
```json
{
  "_metadata": { "createdAt": "2026-05-28T20:00:00.000Z", "version": "2.0.0" },
  "products": [ ... ],
  "transactions": [ ... ],
  "batch_products": [ ... ],
  "production_batch_runs": [ ... ],
  ...
}
```

### Restauración
```typescript
const result = await restoreBackup("backup-2026-05-28-1712345678")
// 1. El servidor lee el backup y sobreescribe los 19 archivos en database/
// 2. syncLoad() borra IndexedDB y recarga desde los archivos restaurados
```

## 5. Integridad y Exportación

### Verificación de integridad
```typescript
const result = await verifyIntegrity()
// → { ok: true, valid: ["products", ...], errors: [], total: 19 }
```
Lee cada archivo JSON en `database/` y verifica que sea JSON válido.

### Exportación completa
```typescript
const result = await fullExport()
// → { ok: true, export: "export-1712345678", tables: ["products", ...] }
```
Crea un archivo único en `exports/export-<timestamp>.json` con todas las tablas.

## 6. Google Drive (Arquitectura Propuesta)

> **⚠️ Estado actual**: No hay integración nativa con Google Drive.
> El sistema guarda TODO en disco local (`userData`). Para backups en la nube
> se requiere implementar una de las siguientes estrategias:

### Opción A: rclone (Recomendada para usuarios técnicos)
```
1. Instalar rclone (https://rclone.org)
2. Configurar Google Drive como remote:
     rclone config
3. Crear script que sincroniza backups/ a Drive:
     rclone sync C:/Users/<user>/AppData/Roaming/LionCore/LionCoreData/backups/ \
       gdrive:LionCoreBackups/
4. Programar tarea en Windows Task Scheduler:
     - Disparador: Diario / Al iniciar sesión
     - Acción: Ejecutar el script rclone
```

### Opción B: Google Drive API (Integración nativa)
```
electron/server.js:
┌─────────────────────────────────────────────────────┐
│  POST /api/persistence/drive-sync                   │
│  1. Autenticar con Google OAuth2                    │
│  2. Subir backup-<date>.json a Google Drive         │
│  3. Respuesta: { ok, driveFileId, link }            │
└─────────────────────────────────────────────────────┘

src/services/persistence.ts:
┌─────────────────────────────────────────────────────┐
│  export async function driveSync(): Promise<...>     │
│  → createBackup() + POST /api/persistence/drive-sync │
└─────────────────────────────────────────────────────┘
```

**Dependencias npm necesarias**:
```bash
npm install googleapis google-auth-library
```

**Endpoints a agregar en server.js**:
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/persistence/drive-auth` | Inicia flujo OAuth |
| `GET` | `/api/persistence/drive-callback` | Callback OAuth |
| `POST` | `/api/persistence/drive-sync` | Sube backup a Drive |
| `GET` | `/api/persistence/drive-list` | Lista backups en Drive |
| `POST` | `/api/persistence/drive-restore` | Restaura desde Drive |

### Opción C: Manual (Copia directa)
El usuario puede navegar a `%APPDATA%/LionCore/LionCoreData/backups/` y copiar
los archivos `.json` manualmente a Google Drive. No requiere desarrollo.

## 7. Resumen de Funciones (API pública)

| Función | Origen | Qué hace |
|---------|--------|----------|
| `isElectron()` | persistence.ts | Detecta si corre en Electron |
| `syncSave()` | persistence.ts | IndexedDB → archivos JSON locales |
| `syncLoad()` | persistence.ts | Archivos JSON locales → IndexedDB |
| `createBackup()` | persistence.ts | Crea backup completo en backups/ |
| `listBackups()` | persistence.ts | Lista backups disponibles |
| `restoreBackup(n)` | persistence.ts | Restaura backup a IndexedDB |
| `verifyIntegrity()` | persistence.ts | Verifica JSONs locales |
| `fullExport()` | persistence.ts | Exporta todo a un archivo único |
| Auto-save (5 min) | App.tsx | Guarda periódicamente en Electron |
| Auto-save (beforeunload) | App.tsx | Guarda al cerrar la app |

## 8. Pruebas

```bash
npm test                 # Ejecuta tests de persistencia (5 tests)
npm run test:watch       # Modo watch para desarrollo
```

Los tests verifican:
- `getExportableCollections()` exporta las 19 tablas
- `importCollections()` restaura incluyendo `batch_products` y `production_batch_runs`
- Colecciones vacías se manejan sin limpiar tablas existentes
