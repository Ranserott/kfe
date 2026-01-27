import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('🔍 Verificando base de datos...\n')

  try {
    // Check if User table exists and has records
    const userCount = await prisma.user.count()
    console.log(`👥 Usuarios: ${userCount}`)

    if (userCount === 0) {
      console.log('⚠️  No hay usuarios en la base de datos')
      console.log('   Debes crear un usuario admin primero')
      console.log('   Ejecuta: npm run create-admin')
    } else {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, email: true, name: true }
      })
      console.log('✅ Usuarios Admin:', admins.map(u => u.email))
    }

    // Check tables
    const tableCount = await prisma.$queryRaw`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    console.log(`\n📊 Tablas en la BD: ${tableCount[0].count}`)

    // Check migrations
    console.log('\n📋 Tablas principales:')
    const tables = ['User', 'Product', 'Category', 'Order', 'Table', 'InventoryItem', 'Provider']
    
    for (const table of tables) {
      try {
        const count = await (prisma as any)[table].count()
        console.log(`   ✅ ${table}: ${count} registros`)
      } catch (e: any) {
        console.log(`   ❌ ${table}: No existe o error`)
      }
    }

    console.log('\n✅ Base de datos conectada correctamente')

  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error)
    console.log('\nSoluciones posibles:')
    console.log('1. Verifica que DATABASE_URL esté correcta en Dokploy')
    console.log('2. Ejecuta: npm run db:push')
    console.log('3. Luego ejecuta: npm run create-admin')
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
