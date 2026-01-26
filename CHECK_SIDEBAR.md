# Verificación de Sidebar Colapsable - kfe POS

## Qué deberías ver en la aplicación:

### 1. Header Desktop (Pantallas grandes - > 1024px)
En la parte superior de la pantalla, deberías ver:
- Un header blanco con el logo de kfe
- **A LA IZQUIERDA del logo:** Un botón con el icono de menú (☰) con **borde amber/naranja**
- Este botón dice "Colapsar/Expandir menú" al pasar el mouse

### 2. Sidebar (Barra lateral negra)
- Ubicada a la izquierda de la pantalla
- Fondo negro/slate-900
- Contiene el menú de navegación (Dashboard, POS, Mesas, etc.)

### 3. Botón Naranja de Colapso
- En el **borde derecho de la sidebar**
- Color **amber/naranja** brillante
- Forma **circular** con flecha izquierda (←) o derecha (→)
- Aparece a la altura del primer item del menú
- Al hacer clic, colapsa/expande la sidebar

## Funcionamiento:

### Desktop (> 1024px):
| Estado | Ancho Sidebar | Botón Header | Botón Naranja |
|--------|--------------|--------------|---------------|
| Expandido | 256px (w-64) | Visible con borde amber | ← (ChevronLeft) |
| Colapsado | 80px (w-20) | Visible con borde amber | → (ChevronRight) |

### Mobile (< 1024px):
| Estado | Sidebar | Header |
|--------|---------|---------|
| Cerrado | Oculta (fuera de pantalla) | Header negro con ☰ |
| Abierto | Visible (desliza hacia adentro) | Header negro con X |

## Pasos para verificar:

### 1. LIMPIAR CACHÉ DEL NAVEGADOR (IMPORTANTE)
```
Mac: Cmd + Shift + R
Windows/Linux: Ctrl + Shift + R
O abrir DevTools y hacer clic derecho en el botón de refresh
```

### 2. Abrir la consola del navegador
```
Presiona F12 o Cmd+Option+I
Ve a la pestaña "Console"
Deberías ver: "Sidebar Debug: {sidebarCollapsed: false, mobileMenuOpen: false, isMobile: false}"
```

### 3. Probar los botones
1. Haz clic en el botón del header (izquierda del logo)
   - La sidebar debería reducirse a 80px
   - En la consola debería cambiar `sidebarCollapsed: true`
2. Haz clic nuevamente
   - La sidebar debería expandirse a 256px
3. Haz clic en el botón naranja circular
   - Debería tener el mismo efecto

### 4. Probar responsive
1. Reduce el ancho de la ventana a menos de 1024px
2. El header debería volverse negro
3. La sidebar debería ocultarse
4. Al hacer clic en ☰, la sidebar debería deslizarse desde la izquierda

## Página de prueba:
Visita: http://localhost:3000/test-sidebar

Esta página muestra:
- El estado actual de todas las variables
- Botones de prueba
- Una simulación visual de la sidebar

## Solución de problemas:

### Si NO ves el botón del header:
1. Limpia la caché (Cmd+Shift+R)
2. Verifica que el ancho de ventana sea > 1024px
3. Abre la consola y busca errores

### Si NO ves el botón naranja:
1. Asegúrate de estar en desktop (> 1024px)
2. El botón está en el BORDE derecho de la sidebar
3. Tiene un borde brillante amber/naranja

### Si la sidebar no responde:
1. Abre la consola del navegador
2. Deberías ver "Sidebar Debug: ..." al cargar
3. Si no lo ves, hay un error de JavaScript

### Si ves errores en consola:
1. Toma una captura de pantalla de la consola
2. Anota el mensaje de error exacto
3. Comparte estos detalles

## Código implementado (resumen):

### Archivo: app/(dashboard)/layout.tsx

**Líneas 59-71:** Variables de estado y debug logging
```typescript
const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
const [isMobile, setIsMobile] = useState(false)
// Debug logging
useEffect(() => {
  console.log('Sidebar Debug:', { sidebarCollapsed, mobileMenuOpen, isMobile })
}, [sidebarCollapsed, mobileMenuOpen, isMobile])
```

**Líneas 180-191:** Header Desktop con botón de toggle
```typescript
<header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 h-16">
  <button
    onClick={toggleSidebar}
    className="p-2 hover:bg-amber-50 rounded-lg border-2 border-amber-400"
    title="Colapsar/Expandir menú"
  >
    <Menu className="h-6 w-6 text-amber-700" />
  </button>
  ...
</header>
```

**Líneas 285-300:** Botón naranja de colapso
```typescript
{!isMobile && (
  <button
    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
    className="absolute -right-4 top-24 bg-amber-600 text-white rounded-full p-2 hover:bg-amber-700 transition-all hover:scale-110 z-[60] shadow-lg border-2 border-amber-400"
    title="Colapsar/Expandir Sidebar"
  >
    {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
  </button>
)}
```

**Líneas 247-256:** Sidebar con width dinámico
```typescript
<aside className={cn(
  'fixed top-0 left-0 z-50 h-full bg-slate-900 text-white transition-all duration-300',
  'lg:translate-x-0',
  sidebarCollapsed && !isMobile ? 'w-20' : 'w-64',
  ...
)}>
```

**Líneas 172-177:** Función toggleSidebar
```typescript
const toggleSidebar = () => {
  if (isMobile) {
    setMobileMenuOpen(!mobileMenuOpen)
  } else {
    setSidebarCollapsed(!sidebarCollapsed)
  }
}
```

## Si después de todo esto NO funcionas:

Por favor proporciona:
1. Captura de pantalla de la página completa
2. Captura de pantalla de la consola del navegador (F12)
3. Ancho de tu ventana de navegador
4. Mensaje de error exacto (si lo hay)
