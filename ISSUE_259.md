# #259 — Sistema de Variantes Automáticas

## Estado: ✅ COMPLETADO

## Implementación

### `src/services/db.ts`
- `createVariantProducts(businessId, categoria, modelos[], colores[], cantidad, ubicacion)` — genera todas las combinaciones modelo×color
- Re-usa `quickCreateProduct()` para evitar duplicados por código
- Límite de 200 combinaciones por seguridad

### `src/components/modals/VariantGeneratorModal.tsx`
- Categoría / producto base
- Modelos: textarea (uno por línea)
- Colores: textarea (uno por línea)
- Cantidad por variante + ubicación opcional
- Preview de productos a generar (hasta 6)
- Conteo total de combinaciones
- Botón "🧬 Generar N producto(s)"

## Funcionalidades
- Generación masiva de combinaciones modelo × color
- Códigos auto-generados únicos (FOR-IP15-NEG, FOR-IP15-AZU, etc.)
- Nombres auto-generados (Forro iPhone 15 Negro)
- Si el producto ya existe (mismo código), suma stock en vez de duplicar
- Buscable por modelo, color, categoría, ubicación

## Pruebas
- [x] TEST 1: Crear producto base (usando Express o modal normal)
- [x] TEST 2: Generar variantes (5 modelos × 3 colores = 15 productos)
- [x] TEST 3: Buscar variante por modelo/color
- [x] TEST 4: Persistencia correcta en IndexedDB
