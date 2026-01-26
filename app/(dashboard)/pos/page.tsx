'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOrder } from '@/lib/server-actions/orders'
import { useRouter } from 'next/navigation'
import { Coffee, Package, Sandwich, Cookie, Plus, Minus, X, Motorbike, Utensils, Store, User, Keyboard, Zap, ShoppingCart } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  categoryId: string
  isPreparable: boolean
  modifiers: Array<{ id: string; name: string; priceAdjust: number }>
}

interface Category {
  id: string
  name: string
  displayOrder: number
  products: Product[]
}

interface CartItem {
  productId: string
  product: Product
  quantity: number
  modifiers: string[]
  notes: string
  unitPrice: number
}

type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'

export default function POSPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tables, setTables] = useState<any[]>([])
  const [orderNotes, setOrderNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [focusedProductIndex, setFocusedProductIndex] = useState(0)
  const [showCart, setShowCart] = useState(false)

  // Delivery form state
  const [showDeliveryForm, setShowDeliveryForm] = useState(false)
  const [deliveryData, setDeliveryData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    deliveryFee: 1500,
    estimatedTime: 30,
  })

  useEffect(() => {
    fetchCategories()
    fetchTables()

    // Check if tableId is in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const tableId = urlParams.get('table')
    if (tableId) {
      setSelectedTable(tableId)
      setOrderType('DINE_IN')
    }
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories)
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables')
      const data = await res.json()
      if (data.success) {
        setTables(data.tables)
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    }
  }

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id && item.modifiers.length === 0)
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id && item.modifiers.length === 0
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          product,
          quantity: 1,
          modifiers: [],
          notes: '',
          unitPrice: product.price,
        },
      ]
    })
  }, [])

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateQuantity = useCallback((index: number, delta: number) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    )
  }, [])

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const totalWithDelivery = cartTotal + (orderType === 'DELIVERY' ? deliveryData.deliveryFee : 0)

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return

    if (orderType === 'DELIVERY') {
      if (!deliveryData.customerName || !deliveryData.customerPhone || !deliveryData.customerAddress) {
        alert('Por favor complete los datos de delivery')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const result = await createOrder({
        tableId: orderType === 'DINE_IN' ? selectedTable || undefined : undefined,
        type: orderType,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          modifiers: item.modifiers,
          notes: item.notes || undefined,
        })),
        notes: orderNotes || undefined,
        deliveryInfo: orderType === 'DELIVERY' ? deliveryData : undefined,
      })

      if (result.success) {
        setCart([])
        setOrderNotes('')
        setSelectedTable(null)
        setDeliveryData({
          customerName: '',
          customerPhone: '',
          customerAddress: '',
          deliveryFee: 1500,
          estimatedTime: 30,
        })
        setShowDeliveryForm(false)
        router.push('/tables')
        router.refresh()
      } else {
        alert(result.error || 'Error al crear la orden')
      }
    } catch (error) {
      alert('Error al crear la orden')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'café':
        return Coffee
      case 'bebidas':
        return Package
      case 'comida':
        return Sandwich
      case 'postres':
        return Cookie
      default:
        return Package
    }
  }

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory)

  const orderTypeConfig = {
    DINE_IN: { label: 'En Local', icon: Utensils, color: 'bg-emerald-100 text-emerald-800 border-emerald-300', shortcut: '1' },
    TAKEAWAY: { label: 'Para Llevar', icon: Package, color: 'bg-blue-100 text-blue-800 border-blue-300', shortcut: '2' },
    DELIVERY: { label: 'Delivery', icon: Motorbike, color: 'bg-purple-100 text-purple-800 border-purple-300', shortcut: '3' },
  }

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Show shortcuts help
      if (e.key === 'F1') {
        e.preventDefault()
        setShowShortcuts(!showShortcuts)
        return
      }

      // Category navigation (F1-F4 or Alt+1-4)
      if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1
        if (categories[index]) {
          setSelectedCategory(categories[index].id)
          setFocusedProductIndex(0)
        }
        return
      }

      // Order type selection (1, 2, 3)
      if (['1', '2', '3'].includes(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const types: OrderType[] = ['DINE_IN', 'TAKEAWAY', 'DELIVERY']
        const typeIndex = parseInt(e.key) - 1
        if (types[typeIndex]) {
          setOrderType(types[typeIndex])
          if (types[typeIndex] !== 'DINE_IN') setSelectedTable(null)
          if (types[typeIndex] !== 'DELIVERY') setShowDeliveryForm(false)
        }
        return
      }

      // Submit order (Ctrl+Enter or Cmd+Enter)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (cart.length > 0) {
          handleSubmitOrder()
        }
        return
      }

      // Clear cart (Escape)
      if (e.key === 'Escape' && cart.length > 0) {
        if (confirm('¿Limpiar carrito?')) {
          setCart([])
          setOrderNotes('')
        }
        return
      }

      // Navigate products (Arrow keys)
      if (selectedCategoryData?.products) {
        const products = selectedCategoryData.products
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          setFocusedProductIndex((prev) => (prev + 1) % products.length)
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setFocusedProductIndex((prev) => (prev - 1 + products.length) % products.length)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          setFocusedProductIndex((prev) => (prev + 4) % products.length)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setFocusedProductIndex((prev) => (prev - 4 + products.length) % products.length)
        } else if (e.key === 'Enter' && products[focusedProductIndex]) {
          e.preventDefault()
          addToCart(products[focusedProductIndex])
        }
      }

      // Quick add last product (Space)
      if (e.key === ' ' && cart.length > 0) {
        e.preventDefault()
        const lastItem = cart[cart.length - 1]
        addToCart(lastItem.product)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [categories, selectedCategory, selectedCategoryData, focusedProductIndex, cart, addToCart])

  // Quick actions
  const quickActions = useMemo(() => ({
    clearCart: () => {
      if (confirm('¿Limpiar carrito?')) {
        setCart([])
        setOrderNotes('')
      }
    },
    selectFirstCategory: () => {
      if (categories.length > 0) {
        setSelectedCategory(categories[0].id)
        setFocusedProductIndex(0)
      }
    },
    toggleDelivery: () => {
      setShowDeliveryForm(!showDeliveryForm)
    },
  }), [categories, showDeliveryForm])

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Keyboard Shortcuts Help Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Keyboard className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Atajos de Teclado</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowShortcuts(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono">1</kbd>
                    <span className="text-sm font-medium">En Local</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono">2</kbd>
                    <span className="text-sm font-medium">Para Llevar</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono">3</kbd>
                    <span className="text-sm font-medium">Delivery</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono">Alt+1-4</kbd>
                    <span className="text-sm font-medium">Categorías</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono">↑↓←→</kbd>
                    <span className="text-sm font-medium">Navegar</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono">Enter</kbd>
                    <span className="text-sm font-medium">Agregar</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono">Space</kbd>
                    <span className="text-sm font-medium">Repetir último</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono">Ctrl+Enter</kbd>
                    <span className="text-sm font-medium">Enviar</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono">Esc</kbd>
                    <span className="text-sm font-medium">Limpiar</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-sm font-mono">F1</kbd>
                    <span className="text-sm font-medium">Ayuda</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <Button onClick={() => setShowShortcuts(false)} className="w-full">
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Products */}
      <div className="flex-1 overflow-auto p-6">
        {/* Header with shortcuts hint */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Zap className="h-4 w-4" />
            <span>Presiona <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">F1</kbd> para ver atajos</span>
          </div>
        </div>

        {/* Order Type Selector */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-slate-700 mb-3">Tipo de Pedido</Label>
          <div className="flex gap-3">
            {(Object.keys(orderTypeConfig) as OrderType[]).map((type) => {
              const config = orderTypeConfig[type]
              const Icon = config.icon
              return (
                <button
                  key={type}
                  onClick={() => {
                    setOrderType(type)
                    if (type !== 'DINE_IN') setSelectedTable(null)
                    if (type !== 'DELIVERY') setShowDeliveryForm(false)
                  }}
                  className={`
                    flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all flex-1 max-w-xs relative
                    ${orderType === type ? config.color + ' ring-2 ring-offset-2' : 'bg-white border-slate-200 hover:border-slate-300'}
                  `}
                >
                  <Icon className="h-6 w-6" />
                  <span className="font-semibold">{config.label}</span>
                  <kbd className="absolute top-2 right-2 px-2 py-0.5 bg-white/50 border border-slate-300 rounded text-xs font-mono">
                    {config.shortcut}
                  </kbd>
                </button>
              )
            })}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category, index) => {
            const Icon = getCategoryIcon(category.name)
            const shortcut = `Alt+${index + 1}`
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors relative
                  ${
                    selectedCategory === category.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {category.name}
                <kbd className="ml-1 px-1.5 py-0.5 bg-black/10 border border-black/20 rounded text-xs font-mono">
                  {index + 1}
                </kbd>
              </button>
            )
          })}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {selectedCategoryData?.products.map((product, index) => {
            const productIndex = selectedCategoryData?.products.indexOf(product) || 0
            const isFocused = productIndex === focusedProductIndex
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={`
                  bg-white rounded-xl p-4 shadow-sm transition-all text-left group relative
                  ${isFocused ? 'ring-2 ring-amber-500 shadow-lg scale-105' : 'hover:shadow-md'}
                `}
              >
                {isFocused && (
                  <div className="absolute -top-1 -right-1 h-6 w-6 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">→</span>
                  </div>
                )}
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-slate-900">{product.name}</h3>
                {product.isPreparable && (
                  <Badge variant="secondary" className="text-xs">
                    Preparable
                  </Badge>
                )}
              </div>
              {product.description && (
                <p className="text-sm text-slate-500 mb-2">{product.description}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-amber-600">
                  ${product.price.toLocaleString()}
                </span>
                <Plus className="h-5 w-5 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </div>
            </button>
            )
          })}
        </div>
      </div>

      {/* Sidebar - Cart */}
      <div className={`
        fixed lg:relative right-0 top-0 h-[calc(100vh-4rem)] bg-white border-l border-slate-200 flex flex-col
        w-96 z-40 transition-transform duration-300 ease-in-out
        ${showCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Order Type & Table Selection */}
        <div className="p-4 border-b border-slate-200 space-y-4">
          {/* Table Selection for Dine-in */}
          {orderType === 'DINE_IN' && (
            <div>
              <Label className="text-sm font-medium text-slate-700">Seleccionar Mesa</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                <button
                  onClick={() => setSelectedTable(null)}
                  className={`
                    px-3 py-2 rounded-lg text-sm transition-colors
                    ${!selectedTable ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                  `}
                >
                  Sin mesa
                </button>
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table.id)}
                    className={`
                      px-3 py-2 rounded-lg text-sm transition-colors
                      ${selectedTable === table.id ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                    `}
                  >
                    M{table.number}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Form */}
          {orderType === 'DELIVERY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700">Datos de Delivery</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeliveryForm(!showDeliveryForm)}
                >
                  {showDeliveryForm ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
              {showDeliveryForm && (
                <div className="space-y-2 mt-2">
                  <Input
                    placeholder="Nombre del cliente"
                    value={deliveryData.customerName}
                    onChange={(e) => setDeliveryData({ ...deliveryData, customerName: e.target.value })}
                  />
                  <Input
                    placeholder="Teléfono"
                    value={deliveryData.customerPhone}
                    onChange={(e) => setDeliveryData({ ...deliveryData, customerPhone: e.target.value })}
                  />
                  <Input
                    placeholder="Dirección de entrega"
                    value={deliveryData.customerAddress}
                    onChange={(e) => setDeliveryData({ ...deliveryData, customerAddress: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Costo Delivery</Label>
                      <Input
                        type="number"
                        value={deliveryData.deliveryFee}
                        onChange={(e) => setDeliveryData({ ...deliveryData, deliveryFee: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">ETA (min)</Label>
                      <Input
                        type="number"
                        value={deliveryData.estimatedTime}
                        onChange={(e) => setDeliveryData({ ...deliveryData, estimatedTime: parseInt(e.target.value) || 30 })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Takeaway Info */}
          {orderType === 'TAKEAWAY' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-800">
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">Pedido para llevar</span>
              </div>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          <h2 className="font-semibold text-slate-900 mb-4">Orden Actual</h2>
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Carrito vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="bg-slate-50 rounded-lg p-3 group relative">
                  <button
                    onClick={() => removeFromCart(index)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-slate-400 hover:text-red-500" />
                  </button>

                  <div className="flex justify-between items-start pr-6">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{item.product.name}</h4>
                      <p className="text-sm text-slate-500">
                        ${item.unitPrice.toLocaleString()} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      ${(item.unitPrice * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(index, -1)}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, 1)}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-4 border-t border-slate-200 space-y-4">
          {/* Quick Actions */}
          {cart.length > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={quickActions.clearCart}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            </div>
          )}

          {/* Notes */}
          <Input
            placeholder="Notas de la orden..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
          />

          {/* Delivery Fee */}
          {orderType === 'DELIVERY' && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Delivery:</span>
              <span className="font-medium">${deliveryData.deliveryFee.toLocaleString()}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-slate-700">Total</span>
            <span className="text-2xl font-bold text-slate-900">
              ${totalWithDelivery.toLocaleString()}
            </span>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmitOrder}
            disabled={cart.length === 0 || isSubmitting || (orderType === 'DINE_IN' && !selectedTable)}
            className="w-full h-12 text-lg relative"
          >
            {isSubmitting ? 'Enviando...' : (
              <>
                Enviar Orden
                <kbd className="absolute right-4 px-2 py-0.5 bg-white/20 border border-white/30 rounded text-xs font-mono">
                  Ctrl+Enter
                </kbd>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Cart Toggle Button */}
      <button
        onClick={() => setShowCart(!showCart)}
        className="lg:hidden fixed bottom-6 right-6 z-50 h-14 w-14 bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <ShoppingCart className="h-6 w-6" />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            {cart.length}
          </span>
        )}
      </button>

      {/* Mobile Cart Overlay */}
      {showCart && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowCart(false)}
        />
      )}
    </div>
  )
}
