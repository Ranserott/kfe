# kfe POS - Contexto del Proyecto

> Última actualización: 2026-01-25

## Resumen del Proyecto

**kfe POS** es un sistema de Punto de Venta (POS) completo diseñado específicamente para cafeterías y restaurantes. Es una solución full-stack que gestiona todos los aspectos de las operaciones: desde la gestión de pedidos hasta el control de inventario.

## Stack Tecnológico

### Frontend
- **Framework**: Next.js 16.1.4 con App Router
- **Lenguaje**: TypeScript 5.9.3
- **UI**: Componentes personalizados con Tailwind CSS v4
- **Estado**: React hooks (useState, useEffect)
- **Auth**: NextAuth.js 4.24.13
- **Iconos**: Lucide React
- **PDF**: jspdf con autotable

### Backend
- **API**: Next.js API Routes (Server Components + Client Components)
- **Database**: PostgreSQL con Prisma ORM
- **Auth**: NextAuth.js con credentials provider
- **Real-time**: Server-Sent Events (SSE) para KDS
- **Forms**: Server Actions con 'use server'

## Estructura del Proyecto

```
/Users/francisco/Documents/Proyectos/kfe/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Rutas de autenticación
│   │   └── login/               # Página de login
│   ├── (dashboard)/              # Rutas protegidas del dashboard
│   │   ├── layout.tsx           # Layout con sidebar
│   │   ├── page.tsx             # Home del dashboard
│   │   ├── pos/                 # Sistema Point of Sale
│   │   ├── tables/              # Gestión de mesas
│   │   ├── kds/                 # Kitchen Display System
│   │   ├── delivery/            # Gestión de deliveries
│   │   ├── customers/           # Gestión de clientes (delivery)
│   │   ├── providers/           # Gestión de proveedores
│   │   ├── users/               # Gestión de personal y roles
│   │   ├── inventory/           # Gestión de inventario
│   │   ├── products/            # Gestión de productos
│   │   ├── reports/             # Analytics y reportes
│   │   └── settings/            # Configuración
│   ├── api/                     # API routes
│   │   ├── auth/[...nextauth]/  # Configuración NextAuth
│   │   ├── orders/              # APIs de pedidos
│   │   ├── tables/              # APIs de mesas
│   │   ├── products/            # APIs de productos
│   │   ├── inventory/           # APIs de inventario
│   │   ├── customers/           # APIs de clientes
│   │   ├── providers/           # APIs de proveedores
│   │   ├── users/               # APIs de usuarios
│   │   ├── delivery/            # APIs de delivery
│   │   ├── analytics/           # API de analytics
│   │   └── kds/                # Actualizaciones real-time KDS
│   ├── globals.css             # Estilos globales
│   ├── layout.tsx              # Root layout
│   └── page.tsx                 # Home (redirige a login)
├── components/                  # Componentes UI reutilizables
│   ├── ui/                     # Componentes base (Button, Card, etc.)
│   ├── features/               # Componentes por feature
│   └── shared/                 # Componentes compartidos
├── lib/                        # Utilidades
│   ├── auth.ts                # Configuración NextAuth
│   ├── prisma.ts              # Cliente Prisma
│   ├── utils.ts               # Funciones utilitarias
│   ├── server-actions/        # Server actions
│   └── hooks/                 # Custom React hooks
├── prisma/                     # Database schema y migraciones
│   ├── schema.prisma          # Schema de base de datos
│   └── seed.ts                # Script de seed
├── .env                       # Variables de entorno
├── .env.example               # Template de entorno
├── next.config.js             # Configuración Next.js
├── package.json               # Dependencias y scripts
├── postcss.config.js          # Configuración PostCSS
└── tsconfig.json             # Configuración TypeScript
```

## Características Principales

### 1. Point of Sale (POS)
- Creación de pedidos con múltiples tipos (Dine-in, Takeaway, Delivery)
- Actualizaciones de inventario en tiempo real
- Catálogo de productos con categorías y modificadores
- Gestión de pedidos y tracking de estados
- Carrito con atajos de teclado

### 2. Gestión de Mesas
- Estado visual de mesas (Free, Occupied, Dirty)
- Asignación de mesas a pedidos
- Layout de mesas
- Actualizaciones de estado para limpieza

### 3. Kitchen Display System (KDS)
- Actualizaciones en tiempo real via Server-Sent Events
- Priorización de pedidos por urgencia
- Tracking de estados (Pending, Preparing, Ready)
- Alertas de pedidos atrasados
- Indicadores de preparación

### 4. Gestión de Delivery
- Creación de pedidos de delivery
- Asignación de drivers
- Tracking de estados de delivery
- Tiempo estimado vs actual
- Gestión de direcciones de clientes

### 5. Gestión de Clientes
- Perfiles de clientes para delivery
- Historial de pedidos
- Identificación de clientes frecuentes
- Historial de direcciones

### 6. Gestión de Proveedores
- CRUD de proveedores
- Información de contacto (teléfono, email, dirección)
- RUC y condiciones de pago
- Asignación de proveedores a items de inventario
- Estadísticas de productos por proveedor

### 7. Gestión de Personal
- CRUD de usuarios del personal
- Asignación de roles (ADMIN, CASHIER, BARTENDER, DRIVER)
- Activación/desactivación de usuarios
- Estadísticas de personal
- Solo accesible para administradores

### 8. Gestión de Inventario
- Tracking de stock en tiempo real
- Alertas de stock bajo
- Consumo de inventario basado en recetas
- Múltiples unidades de stock (gramos, litros, unidades, etc.)

### 9. Gestión de Productos
- Catálogo con categorías
- Gestión de precios
- Modificadores de producto (extras, alternativas)
- Linking de recetas a inventario

### 10. Analytics y Reportes
- Analytics de revenue por tipo de pedido
- Estadísticas de pedidos
- Métricas de utilización de mesas
- Performance de delivery
- Dashboard en tiempo real con KPIs
- Reportes con rango de fechas personalizado

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Acceso completo a todas las features |
| **CASHIER** | POS, Mesas, Clientes, Reportes |
| **BARTENDER** | POS, Mesas, KDS |
| **DRIVER** | POS, Mesas, Delivery |

## Variables de Entorno

```env
# Database (PostgreSQL en Dokploy)
DATABASE_URL="postgresql://user:password@host:5432/kfe?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# App
NODE_ENV="development"
PORT="3000"
```

## Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run db:push      # Push schema a database
npm run db:seed      # Seed de datos iniciales
npm run db:studio    # Abrir Prisma Studio
npm run db:reset     # Reset database
```

## Patrones y Convenciones

### Patrones de Código

1. **Server Components para Data Fetching**
   - API routes para operaciones de datos
   - Server Actions para mutaciones
   - Prisma para acceso a database

2. **Actualizaciones Real-time**
   - Server-Sent Events (SSE) para KDS
   - Intervalos de 30 segundos para dashboard
   - Arquitectura event-driven

3. **Type Safety**
   - TypeScript en toda la aplicación
   - Types de Prisma para entidades
   - Interfaces para respuestas de APIs

4. **Componentes UI**
   - Componentes reutilizables en `/components/ui`
   - Tailwind CSS v4 con theming
   - Design system consistente

5. **Autenticación**
   - Sessions JWT-based
   - Control de acceso por roles
   - Middleware para protección de rutas

### Convenciones de Nomenclatura

- **Archivos**: kebab-case (ej: `pos-page.tsx`)
- **Componentes**: PascalCase (ej: `Card.tsx`)
- **Entidades DB**: PascalCase (ej: `OrderItem`)
- **Rutas API**: nombres descriptivos (ej: `/api/orders`)

### Seguridad

- Password hashing con bcrypt
- Control de acceso basado en roles
- Rutas protegidas via middleware
- Validación de tokens JWT
- Validación de inputs con Zod

### Optimizaciones

- Standalone output para deployment
- Server-side rendering para performance
- Queries eficientes con Prisma
- Actualizaciones real-time sin refresh completo

## Entidades Principales de la Base de Datos

- **Users**: Usuarios con roles
- **Tables**: Mesas con estados
- **Orders**: Pedidos con tipos y estados
- **Products**: Productos con categorías
- **InventoryItems**: Items de inventario con stock
- **Providers**: Proveedores de inventario
- **Customers**: Clientes para delivery
- **DeliveryOrders**: Pedidos de delivery
- **Recipes**: Link de productos a inventario

## Notas Importantes para el Desarrollo

1. **Siempre usar Server Components** para data fetching cuando sea posible
2. **Usar Server Actions** para mutaciones de datos
3. **Mantener type safety** - no usar `any`
4. **Proteger rutas** con middleware basado en roles
5. **Usar Prisma** para todas las operaciones de database
6. **SSE para real-time** en KDS, no polling
7. **Validar inputs** en Server Actions
8. **Manejar errores** apropiadamente en API routes

## Deployment

- **Hosting**: Dokploy
- **Database**: PostgreSQL en Dokploy
- **Build**: Standalone output
- **Environment Variables**: Configurar en Dokploy
