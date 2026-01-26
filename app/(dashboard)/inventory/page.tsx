'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  AlertTriangle,
  Plus,
  Save,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Truck,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  BarChart3,
  Download,
  RefreshCw,
  Warehouse,
} from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  currentStock: number
  minStock: number
  unit: string
  costPerUnit: number | null
  supplier: string | null
  lastRestocked?: Date
}

type StockUnit = 'GRAM' | 'KILOGRAM' | 'MILLILITER' | 'LITER' | 'UNIT' | 'BAG' | 'BOX'

interface StockMovement {
  id: string
  inventoryItemId: string
  quantity: number
  previousStock: number
  newStock: number
  type: 'ADD' | 'REMOVE' | 'ADJUST' | 'ORDER'
  orderId?: string
  notes?: string
  createdAt: Date
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUnit, setSelectedUnit] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ currentStock: number; minStock: number }>({
    currentStock: 0,
    minStock: 0,
  })
  const [formData, setFormData] = useState({
    name: '',
    currentStock: '',
    minStock: '',
    unit: 'UNIT' as StockUnit,
    costPerUnit: '',
    supplier: '',
  })

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/inventory')
      const data = await res.json()
      if (data.success) {
        setItems(data.items)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesUnit = selectedUnit === 'all' || item.unit === selectedUnit
      return matchesSearch && matchesUnit
    })
  }, [items, searchTerm, selectedUnit])

  const lowStockItems = filteredItems.filter((item) => item.currentStock <= item.minStock)
  const outOfStockItems = filteredItems.filter((item) => item.currentStock === 0)
  const healthyItems = filteredItems.filter((item) => item.currentStock > item.minStock)

  const totalValue = useMemo(() => {
    return filteredItems.reduce((sum, item) => {
      return sum + (item.currentStock * (item.costPerUnit || 0))
    }, 0)
  }, [filteredItems])

  const handleQuickAdjust = async (itemId: string, delta: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const newStock = Math.max(0, item.currentStock + delta)
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemId,
          currentStock: newStock,
        }),
      })

      if (res.ok) {
        fetchInventory()
      } else {
        alert('Error al ajustar stock')
      }
    } catch (error) {
      console.error('Error adjusting stock:', error)
      alert('Error al ajustar stock')
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id)
    setEditValues({
      currentStock: item.currentStock,
      minStock: item.minStock,
    })
  }

  const handleSave = async (id: string) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          currentStock: editValues.currentStock,
          minStock: editValues.minStock,
        }),
      })

      if (res.ok) {
        setEditingId(null)
        fetchInventory()
      }
    } catch (error) {
      console.error('Error updating inventory:', error)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValues({ currentStock: 0, minStock: 0 })
  }

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          currentStock: parseFloat(formData.currentStock),
          minStock: parseFloat(formData.minStock),
          unit: formData.unit,
          costPerUnit: formData.costPerUnit ? parseFloat(formData.costPerUnit) : null,
          supplier: formData.supplier || null,
        }),
      })

      if (res.ok) {
        setFormData({
          name: '',
          currentStock: '',
          minStock: '',
          unit: 'UNIT',
          costPerUnit: '',
          supplier: '',
        })
        setShowAddForm(false)
        fetchInventory()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al crear item')
      }
    } catch (error) {
      console.error('Error creating inventory item:', error)
      alert('Error al crear item')
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('¿Eliminar este item del inventario?')) return

    try {
      const res = await fetch(`/api/inventory?id=${itemId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchInventory()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al eliminar item')
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error)
      alert('Error al eliminar item')
    }
  }

  const exportToCSV = () => {
    const csvData = filteredItems.map((item) => ({
      Producto: item.name,
      'Stock Actual': item.currentStock,
      'Stock Mínimo': item.minStock,
      Unidad: item.unit,
      'Costo/Unidad': item.costPerUnit || 0,
      'Valor Total': item.currentStock * (item.costPerUnit || 0),
      Proveedor: item.supplier || '-',
      Estado: item.currentStock === 0 ? 'Sin Stock' : item.currentStock <= item.minStock ? 'Bajo' : 'OK',
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row) => Object.values(row).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getUnitLabel = (unit: string) => {
    const labels: Record<string, string> = {
      GRAM: 'g',
      KILOGRAM: 'kg',
      MILLILITER: 'ml',
      LITER: 'L',
      UNIT: 'unidad',
      BAG: 'bolsa',
      BOX: 'caja',
    }
    return labels[unit] || unit
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { label: 'Sin Stock', color: 'bg-red-500' }
    if (item.currentStock <= item.minStock) return { label: 'Bajo', color: 'bg-amber-500' }
    return { label: 'OK', color: 'bg-emerald-500' }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48 mb-8"></div>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-slate-900">Inventario</h1>
          <p className="text-slate-500 mt-1">Gestiona el stock de ingredientes y suministros</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchInventory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Item
          </Button>
        </div>
      </div>

      {/* Add New Item Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nuevo Item de Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitNew} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre del Producto</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Café molido"
                    required
                  />
                </div>
                <div>
                  <Label>Unidad</Label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as StockUnit })}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    required
                  >
                    <option value="UNIT">Unidad</option>
                    <option value="GRAM">Gramos (g)</option>
                    <option value="KILOGRAM">Kilogramos (kg)</option>
                    <option value="MILLILITER">Mililitros (ml)</option>
                    <option value="LITER">Litros (L)</option>
                    <option value="BAG">Bolsas</option>
                    <option value="BOX">Cajas</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Stock Inicial</Label>
                  <Input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Stock Mínimo</Label>
                  <Input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Costo por Unidad</Label>
                  <Input
                    type="number"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div>
                <Label>Proveedor</Label>
                <Input
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Crear Item</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({
                      name: '',
                      currentStock: '',
                      minStock: '',
                      unit: 'UNIT',
                      costPerUnit: '',
                      supplier: '',
                    })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {outOfStockItems.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Sin Stock</p>
                <p className="text-sm text-red-600">
                  {outOfStockItems.length} {outOfStockItems.length === 1 ? 'item' : 'items'} agotados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-500">Total Items</p>
              <p className="text-2xl font-bold text-slate-900">{filteredItems.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-500">Valor Total</p>
              <p className="text-2xl font-bold text-emerald-600">${totalValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-red-600">Sin Stock</p>
              <p className="text-2xl font-bold text-red-700">{outOfStockItems.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-amber-600">Bajo Stock</p>
              <p className="text-2xl font-bold text-amber-700">{lowStockItems.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-emerald-600">En Buen Estado</p>
              <p className="text-2xl font-bold text-emerald-700">{healthyItems.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full"
              />
            </div>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="all">Todas las unidades</option>
              <option value="UNIT">Unidades</option>
              <option value="GRAM">Gramos</option>
              <option value="KILOGRAM">Kilogramos</option>
              <option value="MILLILITER">Mililitros</option>
              <option value="LITER">Litros</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Items de Inventario
            <Badge variant="secondary">{filteredItems.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p className="text-slate-500">No se encontraron items</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item)
                const stockPercent = item.minStock > 0 ? (item.currentStock / item.minStock) * 100 : 100

                return (
                  <div
                    key={item.id}
                    className={`
                      border rounded-lg p-4 transition-all hover:shadow-md
                      ${item.currentStock === 0 ? 'bg-red-50 border-red-200' : ''}
                      ${item.currentStock <= item.minStock && item.currentStock > 0 ? 'bg-amber-50 border-amber-200' : ''}
                      ${item.currentStock > item.minStock ? 'bg-white border-slate-200' : ''}
                    `}
                  >
                    {editingId === item.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900">{item.name}</h3>
                          <Badge variant="outline">{getUnitLabel(item.unit)}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Stock Actual</Label>
                            <Input
                              type="number"
                              value={editValues.currentStock}
                              onChange={(e) =>
                                setEditValues({ ...editValues, currentStock: parseFloat(e.target.value) || 0 })
                              }
                            />
                          </div>
                          <div>
                            <Label>Stock Mínimo</Label>
                            <Input
                              type="number"
                              value={editValues.minStock}
                              onChange={(e) =>
                                setEditValues({ ...editValues, minStock: parseFloat(e.target.value) || 0 })
                              }
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave(item.id)}>
                            <Save className="h-4 w-4 mr-1" />
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`h-3 w-3 rounded-full ${stockStatus.color}`} />
                              <h3 className="font-semibold text-slate-900">{item.name}</h3>
                              <Badge variant="outline">{getUnitLabel(item.unit)}</Badge>
                              {item.currentStock <= item.minStock && (
                                <Badge variant="danger" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Bajo
                                </Badge>
                              )}
                            </div>
                            {item.supplier && (
                              <p className="text-sm text-slate-500 mb-2">Proveedor: {item.supplier}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(item)}
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-slate-500">Stock Actual</p>
                            <p className="font-semibold text-lg">{item.currentStock}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Stock Mínimo</p>
                            <p className="font-semibold text-lg">{item.minStock}</p>
                          </div>
                          {item.costPerUnit && (
                            <div>
                              <p className="text-slate-500">Costo/Unidad</p>
                              <p className="font-semibold text-lg">${item.costPerUnit}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-slate-500">Valor Total</p>
                            <p className="font-semibold text-lg text-slate-900">
                              ${(item.currentStock * (item.costPerUnit || 0)).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Stock bar */}
                        <div className="mb-3">
                          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                stockPercent < 50
                                  ? 'bg-red-500'
                                  : stockPercent < 100
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(stockPercent, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAdjust(item.id, -10)}
                              disabled={item.currentStock === 0}
                            >
                              <ArrowDown className="h-4 w-4" />
                              -10
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAdjust(item.id, -1)}
                              disabled={item.currentStock === 0}
                            >
                              <ArrowDown className="h-4 w-4" />
                              -1
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAdjust(item.id, 1)}
                            >
                              <ArrowUp className="h-4 w-4" />
                              +1
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAdjust(item.id, 10)}
                            >
                              <ArrowUp className="h-4 w-4" />
                              +10
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            Ajustar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
