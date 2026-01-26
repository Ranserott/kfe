# Deployment - kfe POS

## Dokploy Deployment - Configuración Actual

### Variables de Entorno Configuradas

En tu aplicación de Dokploy, configura estas variables:

```bash
DATABASE_URL="postgresql://root:Rioma150897@database-kfe-v8baxu:5432/kfe"
NEXTAUTH_URL="https://kfe.bytea.cl"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
NODE_ENV="production"
PORT="3000"
```

### Pasos para Deploy

1. **Generar NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

2. **Configurar variables en Dokploy**:
   - Ve a tu aplicación en Dokploy
   - Busca la sección "Environment Variables"
   - Agrega las variables de arriba (reemplaza NEXTAUTH_SECRET con el generado)

3. **Hacer deploy**:
   - Push a GitHub
   - Dokploy hará deploy automático o click en "Deploy"

### Arreglo del Error de Build

El error `Can't reach database server at localhost:5432` ocurria porque las migraciones se ejecutaban durante el build sin acceso a las variables de entorno.

**Solución aplicada**: Modificado `nixpacks.toml` para ejecutar migraciones durante el start phase, cuando las variables ya están disponibles.

## Solución de Problemas

### Error: Can't reach database server at `localhost:5432`

**Solución**: Asegúrate de que `DATABASE_URL` en Dokploy apunte a tu base de datos remota:
```
postgresql://root:Rioma150897@database-kfe-v8baxu:5432/kfe
```
NO a localhost.

### Error: Build failed

**Verifica**:
1. Todas las variables de entorno están configuradas en Dokploy
2. DATABASE_URL es correcta (usa la URL interna de Dokploy)
3. NEXTAUTH_URL apunta a tu dominio (https://kfe.bytea.cl)
4. NEXTAUTH_SECRET es único y seguro

## Local Development

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
