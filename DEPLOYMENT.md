# Deployment - kfe POS

## Dokploy Deployment - Configuración con Docker

### Variables de Entorno Configuradas

En tu aplicación de Dokploy, configura estas variables:

```bash
DATABASE_URL="postgresql://root:Rioma150897@database-kfe-v8baxu:5432/kfe"
NEXTAUTH_URL="https://kfe.bytea.cl"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
NODE_ENV="production"
PORT="3000"
```

### Pasos para Deploy con Docker

1. **Generar NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

2. **Configurar aplicación en Dokploy**:
   - Crea una nueva aplicación
   - Selecciona tu repositorio de GitHub
   - Tipo de build: **Dockerfile** (no Nixpacks)
   - Configura las variables de entorno arriba

3. **Hacer deploy**:
   - Push a GitHub
   - Dokploy detectará el Dockerfile automáticamente
   - Click en "Deploy"

### Estructura del Dockerfile

El Dockerfile usa una configuración multi-stage optimizada:
- **Base**: Node.js 20 Alpine (ligero y seguro)
- **Deps**: Instala dependencias
- **Builder**: Compila Next.js con output standalone
- **Runner**: Imagen final de producción
- Migraciones de Prisma se ejecutan al iniciar el container

## Solución de Problemas

### Error: EBUSY durante build

**Solución**: Usar Dockerfile en lugar de Nixpacks. Nixpacks tiene problemas de cache con npm.

### Error: Can't reach database server

**Verifica**:
1. `DATABASE_URL` apunta a tu base de datos remota de Dokploy
2. NO uses localhost en producción
3. La base de datos está corriendo en Dokploy

### Error: Cannot find module

**Solución**: El Dockerfile instala todas las dependencias necesarias. Si persiste, haz un rebuild sin cache.

## Local Development con Docker

```bash
# Construir imagen
docker build -t kfe-pos .

# Correr container
docker run -p 3000:3000 --env-file .env kfe-pos
```

## Local Development (sin Docker)

```bash
# Instalar dependencias
npm install

# Configurar .env local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kfe?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cualquier-valor-local"

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

## URLs

- **Producción**: https://kfe.bytea.cl
- **Repositorio**: https://github.com/Ranserott/kfe
- **Docker Hub**: (opcional, para registry privado)
