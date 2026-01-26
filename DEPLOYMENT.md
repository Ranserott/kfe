# Deployment - kfe POS

## Dokploy Deployment

### 1. Configurar Base de Datos en Dokploy

1. Ve a tu panel de Dokploy
2. Crea una nueva base de datos PostgreSQL
3. Copia la **Connection String** de la base de datos

### 2. Configurar Variables de Entorno

En tu aplicación de Dokploy, agrega las siguientes variables:

```bash
DATABASE_URL="postgresql://postgres:TU_PASSWORD@TU_HOST:5432/kfe?schema=public"
NEXTAUTH_URL="https://tu-subdominio.dokploy.com"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
NODE_ENV="production"
PORT="3000"
```

### 3. Generar NEXTAUTH_SECRET

En tu terminal local:
```bash
openssl rand -base64 32
```

Copia el resultado y úsalo como valor de `NEXTAUTH_SECRET`.

### 4. Hacer Deploy

1. Push tus cambios a GitHub
2. En Dokploy, selecciona tu repositorio
3. Click en "Deploy"

### Solución de Problemas

#### Error: Can't reach database server at `localhost:5432`

**Problema**: La variable `DATABASE_URL` está apuntando a `localhost`.

**Solución**: Configura la variable `DATABASE_URL` en Dokploy con la URL de tu base de datos remota, NO localhost.

#### Error: Build failed

**Problema**: Las variables de entorno no están configuradas correctamente.

**Solución**: Asegúrate de agregar todas las variables en el panel de Dokploy ANTES de hacer deploy.

## Local Development

```bash
# Instalar dependencias
npm install

# Configurar base de datos local
# Edita .env con: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kfe?schema=public"

# Ejecutar migraciones
npm run db:push

# Sembrar datos de prueba
npm run db:seed

# Iniciar servidor
npm run dev
```

## Comandos Útiles

```bash
npm run build          # Build para producción
npm run start          # Iniciar producción
npm run db:push        # Push schema a database
npm run db:seed        # Seed de datos
npm run db:studio      # Abrir Prisma Studio
```
