import { config } from 'dotenv'
config()

import { PrismaClient, Role, TableStatus, StockUnit } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // ===============================
  // 1. USUARIOS
  // ===============================
  console.log('👤 Creating users...')

  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kfe.com' },
    update: {},
    create: {
      email: 'admin@kfe.com',
      name: 'Admin',
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  })

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@kfe.com' },
    update: {},
    create: {
      email: 'cashier@kfe.com',
      name: 'Cajero',
      password: await bcrypt.hash('cashier123', 10),
      role: Role.CASHIER,
      isActive: true,
    },
  })

  const bartender = await prisma.user.upsert({
    where: { email: 'bar@kfe.com' },
    update: {},
    create: {
      email: 'bar@kfe.com',
      name: 'Bartender',
      password: await bcrypt.hash('bar123', 10),
      role: Role.BARTENDER,
      isActive: true,
    },
  })

  console.log(`  ✅ Created ${await prisma.user.count()} users`)

  // ===============================
  // 2. CATEGORÍAS
  // ===============================
  console.log('📁 Creating categories...')

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Café' },
      update: {},
      create: { name: 'Café', displayOrder: 1 },
    }),
    prisma.category.upsert({
      where: { name: 'Bebidas' },
      update: {},
      create: { name: 'Bebidas', displayOrder: 2 },
    }),
    prisma.category.upsert({
      where: { name: 'Comida' },
      update: {},
      create: { name: 'Comida', displayOrder: 3 },
    }),
    prisma.category.upsert({
      where: { name: 'Postres' },
      update: {},
      create: { name: 'Postres', displayOrder: 4 },
    }),
  ])

  console.log(`  ✅ Created ${categories.length} categories`)

  // ===============================
  // 3. ITEMS DE INVENTARIO
  // ===============================
  console.log('📦 Creating inventory items...')

  const inventoryItems = await Promise.all([
    // Café
    prisma.inventoryItem.upsert({
      where: { name: 'Café molido' },
      update: {},
      create: {
        name: 'Café molido',
        currentStock: 5000,
        minStock: 1000,
        unit: StockUnit.GRAM,
        costPerUnit: 0.05,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { name: 'Leche entera' },
      update: {},
      create: {
        name: 'Leche entera',
        currentStock: 20000,
        minStock: 5000,
        unit: StockUnit.MILLILITER,
        costPerUnit: 0.001,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { name: 'Leche oat' },
      update: {},
      create: {
        name: 'Leche oat',
        currentStock: 10000,
        minStock: 2000,
        unit: StockUnit.MILLILITER,
        costPerUnit: 0.002,
      },
    }),
    // Bebidas
    prisma.inventoryItem.upsert({
      where: { name: 'Agua' },
      update: {},
      create: {
        name: 'Agua',
        currentStock: 50000,
        minStock: 10000,
        unit: StockUnit.MILLILITER,
        costPerUnit: 0.0005,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { name: 'Jugo de naranja' },
      update: {},
      create: {
        name: 'Jugo de naranja',
        currentStock: 15000,
        minStock: 3000,
        unit: StockUnit.MILLILITER,
        costPerUnit: 0.003,
      },
    }),
    // Comida
    prisma.inventoryItem.upsert({
      where: { name: 'Pan croissant' },
      update: {},
      create: {
        name: 'Pan croissant',
        currentStock: 50,
        minStock: 10,
        unit: StockUnit.UNIT,
        costPerUnit: 1.5,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { name: 'Queso' },
      update: {},
      create: {
        name: 'Queso',
        currentStock: 3000,
        minStock: 500,
        unit: StockUnit.GRAM,
        costPerUnit: 0.02,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { name: 'Jamón' },
      update: {},
      create: {
        name: 'Jamón',
        currentStock: 2000,
        minStock: 500,
        unit: StockUnit.GRAM,
        costPerUnit: 0.03,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { name: 'Harina' },
      update: {},
      create: {
        name: 'Harina',
        currentStock: 10000,
        minStock: 2000,
        unit: StockUnit.GRAM,
        costPerUnit: 0.002,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { name: 'Azúcar' },
      update: {},
      create: {
        name: 'Azúcar',
        currentStock: 8000,
        minStock: 2000,
        unit: StockUnit.GRAM,
        costPerUnit: 0.002,
      },
    }),
  ])

  console.log(`  ✅ Created ${inventoryItems.length} inventory items`)

  // ===============================
  // 4. PRODUCTOS
  // ===============================
  console.log('☕ Creating products...')

  const coffeeCategory = categories[0]
  const drinksCategory = categories[1]
  const foodCategory = categories[2]
  const dessertCategory = categories[3]

  const coffeeGround = inventoryItems[0]
  const milkWhole = inventoryItems[1]
  const milkOat = inventoryItems[2]
  const water = inventoryItems[3]
  const orangeJuice = inventoryItems[4]
  const croissant = inventoryItems[5]
  const cheese = inventoryItems[6]
  const ham = inventoryItems[7]
  const flour = inventoryItems[8]
  const sugar = inventoryItems[9]

  const products = await Promise.all([
    // CAFÉS
    prisma.product.upsert({
      where: { id: 'espresso' },
      update: {},
      create: {
        id: 'espresso',
        name: 'Espresso',
        description: 'Café concentrado y aromático',
        price: 2.5,
        categoryId: coffeeCategory.id,
        isPreparable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'americano' },
      update: {},
      create: {
        id: 'americano',
        name: 'Americano',
        description: 'Espresso con agua caliente',
        price: 3.0,
        categoryId: coffeeCategory.id,
        isPreparable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'cappuccino' },
      update: {},
      create: {
        id: 'cappuccino',
        name: 'Cappuccino',
        description: 'Espresso con leche espumada',
        price: 4.5,
        categoryId: coffeeCategory.id,
        isPreparable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'latte' },
      update: {},
      create: {
        id: 'latte',
        name: 'Latte',
        description: 'Espresso con leche vaporizada',
        price: 4.5,
        categoryId: coffeeCategory.id,
        isPreparable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'flat-white' },
      update: {},
      create: {
        id: 'flat-white',
        name: 'Flat White',
        description: 'Microespuma con espresso',
        price: 4.0,
        categoryId: coffeeCategory.id,
        isPreparable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'mocha' },
      update: {},
      create: {
        id: 'mocha',
        name: 'Mocha',
        description: 'Latte con chocolate',
        price: 5.0,
        categoryId: coffeeCategory.id,
        isPreparable: true,
      },
    }),

    // BEBIDAS
    prisma.product.upsert({
      where: { id: 'water-bottle' },
      update: {},
      create: {
        id: 'water-bottle',
        name: 'Agua embotellada',
        description: 'Agua mineral 500ml',
        price: 2.0,
        categoryId: drinksCategory.id,
        isPreparable: false,
      },
    }),
    prisma.product.upsert({
      where: { id: 'orange-juice' },
      update: {},
      create: {
        id: 'orange-juice',
        name: 'Jugo de Naranja',
        description: 'Jugo natural recién exprimido',
        price: 4.0,
        categoryId: drinksCategory.id,
        isPreparable: true,
      },
    }),

    // COMIDA
    prisma.product.upsert({
      where: { id: 'croissant-butter' },
      update: {},
      create: {
        id: 'croissant-butter',
        name: 'Croissant de Mantequilla',
        description: 'Horneado fresco cada mañana',
        price: 3.5,
        categoryId: foodCategory.id,
        isPreparable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'ham-cheese-sandwich' },
      update: {},
      create: {
        id: 'ham-cheese-sandwich',
        name: 'Sándwich Jamón y Queso',
        description: 'Pan artesanal con jamón y queso gratinado',
        price: 8.5,
        categoryId: foodCategory.id,
        isPreparable: true,
      },
    }),

    // POSTRES
    prisma.product.upsert({
      where: { id: 'chocolate-cookie' },
      update: {},
      create: {
        id: 'chocolate-cookie',
        name: 'Cookie de Chocolate',
        description: 'Con trozos de chocolate belga',
        price: 3.0,
        categoryId: dessertCategory.id,
        isPreparable: false,
      },
    }),
    prisma.product.upsert({
      where: { id: 'brownie' },
      update: {},
      create: {
        id: 'brownie',
        name: 'Brownie',
        description: 'Cálido con helado de vainilla',
        price: 6.0,
        categoryId: dessertCategory.id,
        isPreparable: true,
      },
    }),
  ])

  console.log(`  ✅ Created ${products.length} products`)

  // ===============================
  // 5. MODIFICADORES
  // ===============================
  console.log('➕ Creating modifiers...')

  const espresso = products.find((p) => p.id === 'espresso')!
  const latte = products.find((p) => p.id === 'latte')!
  const cappuccino = products.find((p) => p.id === 'cappuccino')!

  await Promise.all([
    // Extra shot para café
    prisma.modifier.upsert({
      where: { id: 'extra-shot-espresso' },
      update: {},
      create: {
        id: 'extra-shot-espresso',
        productId: espresso.id,
        name: 'Shot extra',
        priceAdjust: 1.0,
      },
    }),
    prisma.modifier.upsert({
      where: { id: 'extra-shot-latte' },
      update: {},
      create: {
        id: 'extra-shot-latte',
        productId: latte.id,
        name: 'Shot extra',
        priceAdjust: 1.0,
      },
    }),
    // Leches alternativas
    prisma.modifier.upsert({
      where: { id: 'oat-latte' },
      update: {},
      create: {
        id: 'oat-latte',
        productId: latte.id,
        name: 'Leche Oat',
        priceAdjust: 0.5,
      },
    }),
    prisma.modifier.upsert({
      where: { id: 'oat-cappuccino' },
      update: {},
      create: {
        id: 'oat-cappuccino',
        productId: cappuccino.id,
        name: 'Leche Oat',
        priceAdjust: 0.5,
      },
    }),
  ])

  console.log(`  ✅ Created modifiers`)

  // ===============================
  // 6. RECETAS
  // ===============================
  console.log('📝 Creating recipes...')

  const productMap = new Map(products.map((p) => [p.id, p]))

  await Promise.all([
    // Espresso: 18g de café
    prisma.recipe.upsert({
      where: { id: 'recipe-espresso' },
      update: {},
      create: {
        id: 'recipe-espresso',
        productId: productMap.get('espresso')!.id,
        inventoryItemId: coffeeGround.id,
        quantity: 18,
      },
    }),

    // Americano: 18g café + 150ml agua
    prisma.recipe.upsert({
      where: { id: 'recipe-americano-coffee' },
      update: {},
      create: {
        id: 'recipe-americano-coffee',
        productId: productMap.get('americano')!.id,
        inventoryItemId: coffeeGround.id,
        quantity: 18,
      },
    }),

    // Cappuccino: 18g café + 120ml leche
    prisma.recipe.upsert({
      where: { id: 'recipe-cappuccino-coffee' },
      update: {},
      create: {
        id: 'recipe-cappuccino-coffee',
        productId: productMap.get('cappuccino')!.id,
        inventoryItemId: coffeeGround.id,
        quantity: 18,
      },
    }),
    prisma.recipe.upsert({
      where: { id: 'recipe-cappuccino-milk' },
      update: {},
      create: {
        id: 'recipe-cappuccino-milk',
        productId: productMap.get('cappuccino')!.id,
        inventoryItemId: milkWhole.id,
        quantity: 120,
      },
    }),

    // Latte: 18g café + 200ml leche
    prisma.recipe.upsert({
      where: { id: 'recipe-latte-coffee' },
      update: {},
      create: {
        id: 'recipe-latte-coffee',
        productId: productMap.get('latte')!.id,
        inventoryItemId: coffeeGround.id,
        quantity: 18,
      },
    }),
    prisma.recipe.upsert({
      where: { id: 'recipe-latte-milk' },
      update: {},
      create: {
        id: 'recipe-latte-milk',
        productId: productMap.get('latte')!.id,
        inventoryItemId: milkWhole.id,
        quantity: 200,
      },
    }),

    // Flat White: 18g café + 150ml leche
    prisma.recipe.upsert({
      where: { id: 'recipe-flat-white-coffee' },
      update: {},
      create: {
        id: 'recipe-flat-white-coffee',
        productId: productMap.get('flat-white')!.id,
        inventoryItemId: coffeeGround.id,
        quantity: 18,
      },
    }),
    prisma.recipe.upsert({
      where: { id: 'recipe-flat-white-milk' },
      update: {},
      create: {
        id: 'recipe-flat-white-milk',
        productId: productMap.get('flat-white')!.id,
        inventoryItemId: milkWhole.id,
        quantity: 150,
      },
    }),

    // Mocha: 18g café + 150ml leche + 20g chocolate
    prisma.recipe.upsert({
      where: { id: 'recipe-mocha-coffee' },
      update: {},
      create: {
        id: 'recipe-mocha-coffee',
        productId: productMap.get('mocha')!.id,
        inventoryItemId: coffeeGround.id,
        quantity: 18,
      },
    }),
    prisma.recipe.upsert({
      where: { id: 'recipe-mocha-milk' },
      update: {},
      create: {
        id: 'recipe-mocha-milk',
        productId: productMap.get('mocha')!.id,
        inventoryItemId: milkWhole.id,
        quantity: 150,
      },
    }),

    // Jugo de naranja: 200ml
    prisma.recipe.upsert({
      where: { id: 'recipe-orange-juice' },
      update: {},
      create: {
        id: 'recipe-orange-juice',
        productId: productMap.get('orange-juice')!.id,
        inventoryItemId: orangeJuice.id,
        quantity: 200,
      },
    }),

    // Croissant: 1 unidad
    prisma.recipe.upsert({
      where: { id: 'recipe-croissant' },
      update: {},
      create: {
        id: 'recipe-croissant',
        productId: productMap.get('croissant-butter')!.id,
        inventoryItemId: croissant.id,
        quantity: 1,
      },
    }),

    // Sándwich: 1 croissant + 60g queso + 50g jamón
    prisma.recipe.upsert({
      where: { id: 'recipe-sandwich-bread' },
      update: {},
      create: {
        id: 'recipe-sandwich-bread',
        productId: productMap.get('ham-cheese-sandwich')!.id,
        inventoryItemId: croissant.id,
        quantity: 1,
      },
    }),
    prisma.recipe.upsert({
      where: { id: 'recipe-sandwich-cheese' },
      update: {},
      create: {
        id: 'recipe-sandwich-cheese',
        productId: productMap.get('ham-cheese-sandwich')!.id,
        inventoryItemId: cheese.id,
        quantity: 60,
      },
    }),
    prisma.recipe.upsert({
      where: { id: 'recipe-sandwich-ham' },
      update: {},
      create: {
        id: 'recipe-sandwich-ham',
        productId: productMap.get('ham-cheese-sandwich')!.id,
        inventoryItemId: ham.id,
        quantity: 50,
      },
    }),

    // Brownie: 50g harina + 30g azúcar
    prisma.recipe.upsert({
      where: { id: 'recipe-brownie-flour' },
      update: {},
      create: {
        id: 'recipe-brownie-flour',
        productId: productMap.get('brownie')!.id,
        inventoryItemId: flour.id,
        quantity: 50,
      },
    }),
    prisma.recipe.upsert({
      where: { id: 'recipe-brownie-sugar' },
      update: {},
      create: {
        id: 'recipe-brownie-sugar',
        productId: productMap.get('brownie')!.id,
        inventoryItemId: sugar.id,
        quantity: 30,
      },
    }),
  ])

  console.log(`  ✅ Created recipes`)

  // ===============================
  // 7. MESAS
  // ===============================
  console.log('🪑 Creating tables...')

  for (let i = 1; i <= 8; i++) {
    await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: {
        number: i,
        capacity: i <= 4 ? 2 : 4,
        status: TableStatus.FREE,
        positionX: ((i - 1) % 4) * 150 + 50,
        positionY: Math.floor((i - 1) / 4) * 150 + 50,
      },
    })
  }

  console.log(`  ✅ Created ${await prisma.table.count()} tables`)

  console.log('\n✨ Seed completed successfully!')
  console.log('\n📧 Login credentials:')
  console.log('   Admin: admin@kfe.com / admin123')
  console.log('   Cashier: cashier@kfe.com / cashier123')
  console.log('   Bartender: bar@kfe.com / bar123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
