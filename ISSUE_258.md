# #258 — Inventario Express (Carga Ultra Rápida)

## Estado: ✅ COMPLETADO

## Implementación

### `src/services/db.ts`
- `generateExpressCode(categoria, modelo, color)` — genera código tipo `FOR-IP15-NEG`
- `generateExpressName(categoria, modelo, color)` — genera nombre tipo `Forro iPhone 15 Negro`
- `quickCreateProduct()` — crea o actualiza stock si ya existe (por código)
- Nueva función exportada

### `src/components/modals/ExpressInventoryModal.tsx`
- Formulario ultra rápido con: Categoría, Modelo, Color, Cantidad, Ubicación
- Autocomplete para categorías, colores y ubicaciones (datalists)
- Preview en vivo de nombre + código generado
- Botón "Guardar y otro" + "Guardar y salir"
- Mantiene ubicación seleccionada (localStorage)
- Auto-genera nombre y código

### `src/components/views/InventoryView.tsx`
- Botón "⚡ Express" en el header del inventario
- Filtro de búsqueda incluye modelo, color, ubicación

## Pruebas
- [x] TEST 1: Crear 20 productos seguidos con "Guardar y otro"
- [x] TEST 2: Validar velocidad (formulario minimalista)
- [x] TEST 3: Códigos auto-generados sin duplicados
- [x] TEST 4: Persistencia correcta en IndexedDB
