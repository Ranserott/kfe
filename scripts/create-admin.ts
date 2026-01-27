import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const email = 'admin@kfe.cl'
  const password = 'Admin123!'

  // Check if admin already exists
  const existing = await prisma.user.findUnique({
    where: { email }
  })

  if (existing) {
    console.log('✅ El usuario admin ya existe')
    console.log('Email:', email)
    return
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash(password, 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      phone: '+56 9 1234 5678',
    },
  })

  console.log('✅ Usuario admin creado exitosamente')
  console.log('Email:', admin.email)
  console.log('Password:', password)
  console.log('Rol:', admin.role)
  console.log('')
  console.log('🔐 Puedes iniciar sesión con:')
  console.log('   Email:', email)
  console.log('   Password:', password)
}

createAdmin()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
