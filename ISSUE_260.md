# #260 — Ubicaciones Físicas y Búsqueda Instantánea

## Estado: ✅ COMPLETADO

## Implementación

### `src/services/db.ts`
- Campos `ubicacion`, `subUbicacion` agregados a `Product` y `ProductStock`
- Campos `modelo`, `color` agregados a `Product` (para variantes)
- `searchProducts()` filtro mejorado: busca por modelo, color, ubicacion, subUbicacion
- `getStockByProduct()` incluye los nuevos campos en el resultado

### `src/components/views/InventoryView.tsx`
- Tabla: columnas "Modelo", "Color", "Ubicación" con pin 📍
- Cards: muestra modelo·color y 📍 ubicación en la tarjeta
- Búsqueda instantánea: filtra por modelo, color, ubicación, subUbicación
- Placeholder actualizado: "nombre / código / modelo / color / ubicación..."

## Funcionalidades
- Buscar por modelo: "iPhone 15" → muestra todos los forros/accesorios de ese modelo
- Buscar por color: "Negro" → muestra todos los productos en negro
- Buscar por ubicación: "Caja B" → muestra todo lo que está en esa caja
- Buscar por categoría: "Forro" → todos los forros
- Mostrar ubicación exacta en cards y tabla

## Futuro (preparado)
- QR por caja/ubicación
- Escáner QR para consulta rápida
- Escáner código de barras

## Pruebas
- [x] TEST 1: Buscar producto por modelo
- [x] TEST 2: Mostrar ubicación correcta en cards y tabla
- [x] TEST 3: Búsqueda rápida (< 1s incluso con 500+ productos)
- [x] TEST 4: Persistencia de campos ubicación/subUbicación
