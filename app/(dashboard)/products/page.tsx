'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Utensils, Plus, X, Pencil, Search, DollarSign, Package, Power, RefreshCw, FolderOpen, Edit2, Trash2, Barcode } from 'lucide-react'

interface Category {
  id: string
  name: string
  displayOrder: number
  _count?: {
    products: number
  }
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  barcode: string | null
  categoryId: string
  category: Category
  isPreparable: boolean
  isActive: boolean
  modifiers: any[]
  createdAt: string
  updatedAt: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    barcode: '',
    categoryId: '',
    isPreparable: true,
  })
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    displayOrder: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const searchByBarcode = async () => {
    if (!barcodeSearch.trim()) return

    const product = products.find((p) => p.barcode === barcodeSearch.trim())
    if (product) {
      alert(`Producto encontrado: ${product.name} - $${product.price}`)
      setBarcodeSearch('')
    } else {
      alert('Producto no encontrado con este código de barras')
    }
  }

  const handleBarcodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchByBarcode()
    }
  }

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ])

      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()

      if (productsData.success) setProducts(productsData.products)
      if (categoriesData.success) setCategories(categoriesData.categories)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeProducts = products.filter((p) => p.isActive)
  const inactiveProducts = products.filter((p) => !p.isActive)
  const avgPrice = products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0

  const toggleProductActive = async (productId: string, currentState: boolean) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, isActive: !currentState }),
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error toggling product:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          barcode: formData.barcode || null,
        }),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({ name: '', description: '', price: '', barcode: '', categoryId: '', isPreparable: true })
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al crear producto')
      }
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      barcode: product.barcode || '',
      categoryId: product.categoryId,
      isPreparable: product.isPreparable,
    })
    setShowForm(true)
  }

  // Category management functions
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryFormData.name,
          displayOrder: categoryFormData.displayOrder || 0,
        }),
      })

      if (res.ok) {
        setCategoryFormData({ name: '', displayOrder: 0 })
        setShowCategoryForm(false)
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al crear categoría')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Error al crear categoría')
    }
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    try {
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: categoryFormData.name,
          displayOrder: categoryFormData.displayOrder,
        }),
      })

      if (res.ok) {
        setCategoryFormData({ name: '', displayOrder: 0 })
        setEditingCategory(null)
        setShowCategoryForm(false)
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al actualizar categoría')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Error al actualizar categoría')
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryFormData({
      name: category.name,
      displayOrder: category.displayOrder,
    })
    setShowCategoryForm(true)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return

    try {
      const res = await fetch(`/api/categories?id=${categoryId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al eliminar categoría')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error al eliminar categoría')
    }
  }

  const groupedProducts = categories.reduce((acc, category) => {
    acc[category.name] = filteredProducts.filter((p) => p.categoryId === category.id)
    return acc
  }, {} as Record<string, Product[]>)

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-8"></div>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Productos</h1>
          <p className="text-slate-500 mt-1">Gestiona el menú y precios del local</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-80"
            />
          </div>
          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
            <Barcode className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Escanear código de barras..."
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
              onKeyDown={handleBarcodeKeyPress}
              className="outline-none w-48 text-sm"
            />
            <Button variant="ghost" size="sm" onClick={searchByBarcode}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
          <Button variant="outline" onClick={() => setShowCategoryForm(!showCategoryForm)}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Gestión Categorías
          </Button>
        </div>
      </div>

      {/* Category Management */}
      {showCategoryForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
              <div>
                <Label>Nombre de la Categoría</Label>
                <Input
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="Ej: Café, Bebidas, Comida..."
                  required
                />
              </div>
              <div>
                <Label>Orden de Visualización</Label>
                <Input
                  type="number"
                  value={categoryFormData.displayOrder}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, displayOrder: parseInt(e.target.value) || 0 })}
                  placeholder="0 para mostrar primero"
                />
                <p className="text-xs text-slate-500 mt-1">Número menor aparece primero en el menú</p>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCategoryForm(false)
                    setEditingCategory(null)
                    setCategoryFormData({ name: '', displayOrder: 0 })
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      {!showCategoryForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Categorías
              <Badge variant="secondary">{categories.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-900">{category.name}</h4>
                      <p className="text-xs text-slate-500">Orden: {category.displayOrder}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {category._count?.products || 0} productos
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{products.length}</div>
                <div className="text-sm text-slate-500">Total Productos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Power className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{activeProducts.length}</div>
                <div className="text-sm text-slate-500">Activos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                <Power className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-600">{inactiveProducts.length}</div>
                <div className="text-sm text-slate-500">Inactivos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">${avgPrice.toFixed(0)}</div>
                <div className="text-sm text-slate-500">Precio Promedio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Descripción</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Código de Barras (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Barcode className="h-4 w-4 text-slate-400" />
                  <Input
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Escanear o ingresar código de barras"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Usa el lector de código de barras para escanear automáticamente</p>
              </div>
              <div>
                <Label>Categoría</Label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPreparable}
                    onChange={(e) => setFormData({ ...formData, isPreparable: e.target.checked })}
                    className="rounded"
                  />
                  <span>Requiere preparación</span>
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingProduct ? 'Actualizar' : 'Crear'} Producto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingProduct(null)
                    setFormData({ name: '', description: '', price: '', barcode: '', categoryId: '', isPreparable: true })
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Products by Category */}
      <div className="space-y-6">
        {Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
          <Card key={categoryName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                {categoryName}
                <Badge variant="secondary">{categoryProducts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${!product.isActive ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {product.name}
                        </h3>
                        {product.isPreparable && (
                          <Badge variant="secondary" className="text-xs">
                            Preparable
                          </Badge>
                        )}
                        {product.barcode && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Barcode className="h-3 w-3" />
                            {product.barcode}
                          </Badge>
                        )}
                        {product.modifiers && product.modifiers.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.modifiers.length} opciones
                          </Badge>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-sm text-slate-500">{product.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${product.isActive ? 'text-amber-600' : 'text-slate-400'}`}>
                        ${product.price.toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleProductActive(product.id, product.isActive)}
                        title={product.isActive ? 'Desactivar' : 'Activar'}
                      >
                        <Power className={`h-4 w-4 ${product.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
