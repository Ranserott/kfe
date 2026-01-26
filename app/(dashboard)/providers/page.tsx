'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Building2, Mail, Phone, MapPin, FileText, Search, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Package } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

interface Provider {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  ruc: string | null
  contactPerson: string | null
  paymentTerms: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  itemCount?: number
}

type ProvidersResponse = { success: boolean; providers: Provider[] }

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    ruc: '',
    contactPerson: '',
    paymentTerms: '',
    notes: '',
    isActive: true,
  })

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers')
      const data: ProvidersResponse = await res.json()
      if (data.success) {
        setProviders(data.providers)
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  const filteredProviders = providers.filter((provider) =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.phone.includes(searchTerm) ||
    (provider.ruc && provider.ruc.includes(searchTerm))
  )

  const stats = {
    totalProviders: providers.length,
    activeProviders: providers.filter((p) => p.isActive).length,
    withRuc: providers.filter((p) => p.ruc).length,
    totalItems: providers.reduce((sum, p) => sum + (p.itemCount || 0), 0),
  }

  const openCreateModal = () => {
    setEditingProvider(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      ruc: '',
      contactPerson: '',
      paymentTerms: '',
      notes: '',
      isActive: true,
    })
    setShowModal(true)
  }

  const openEditModal = (provider: Provider) => {
    setEditingProvider(provider)
    setFormData({
      name: provider.name,
      phone: provider.phone,
      email: provider.email || '',
      address: provider.address || '',
      ruc: provider.ruc || '',
      contactPerson: provider.contactPerson || '',
      paymentTerms: provider.paymentTerms || '',
      notes: provider.notes || '',
      isActive: provider.isActive,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingProvider ? `/api/providers/${editingProvider.id}` : '/api/providers'
    const method = editingProvider ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        setShowModal(false)
        fetchProviders()
      } else {
        alert(data.error || 'Error al guardar proveedor')
      }
    } catch (error) {
      console.error('Error saving provider:', error)
      alert('Error al guardar proveedor')
    }
  }

  const handleToggleActive = async (provider: Provider) => {
    if (!confirm(`¿${provider.isActive ? 'Desactivar' : 'Activar'} proveedor ${provider.name}?`)) return

    try {
      const res = await fetch(`/api/providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...provider, isActive: !provider.isActive }),
      })

      const data = await res.json()
      if (data.success) {
        fetchProviders()
      } else {
        alert(data.error || 'Error al actualizar proveedor')
      }
    } catch (error) {
      console.error('Error toggling provider:', error)
      alert('Error al actualizar proveedor')
    }
  }

  const handleDelete = async (provider: Provider) => {
    if (!confirm(`¿Eliminar proveedor ${provider.name}? Esta acción no se puede deshacer.`)) return

    try {
      const res = await fetch(`/api/providers/${provider.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (data.success) {
        fetchProviders()
      } else {
        alert(data.error || 'Error al eliminar proveedor')
      }
    } catch (error) {
      console.error('Error deleting provider:', error)
      alert('Error al eliminar proveedor')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-slate-900">Proveedores</h1>
          <p className="text-slate-500 mt-1">Gestión de proveedores y contacto</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o RUC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-80"
            />
          </div>
          <Button onClick={openCreateModal} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalProviders}</div>
                <div className="text-sm text-slate-500">Total Proveedores</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <ToggleRight className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{stats.activeProviders}</div>
                <div className="text-sm text-slate-500">Activos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.withRuc}</div>
                <div className="text-sm text-slate-500">Con RUC</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{stats.totalItems}</div>
                <div className="text-sm text-slate-500">Productos Suministrados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Providers List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores ({filteredProviders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProviders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No se encontraron proveedores</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Proveedor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Contacto</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">RUC</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Cond. Pago</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Productos</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviders.map((provider) => (
                    <tr key={provider.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{provider.name}</p>
                            {provider.contactPerson && (
                              <p className="text-xs text-slate-500">Contacto: {provider.contactPerson}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {provider.phone}
                          </div>
                          {provider.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {provider.email}
                            </div>
                          )}
                          {provider.address && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span className="truncate max-w-xs">{provider.address}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {provider.ruc ? (
                          <code className="text-sm bg-slate-100 px-2 py-1 rounded">{provider.ruc}</code>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-600">
                          {provider.paymentTerms || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-slate-900">{provider.itemCount || 0}</div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(provider)}
                          className="flex items-center gap-2"
                        >
                          {provider.isActive ? (
                            <ToggleRight className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-slate-400" />
                          )}
                          <span className={`text-sm ${provider.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {provider.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(provider)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(provider)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <Card
            className="w-full max-w-lg max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre de la Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ruc">RUC</Label>
                    <Input
                      id="ruc"
                      value={formData.ruc}
                      onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPerson">Persona de Contacto</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="paymentTerms">Condiciones de Pago</Label>
                  <Input
                    id="paymentTerms"
                    placeholder="Ej: 30 días, Contado, 15 días"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent min-h-[80px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Proveedor activo
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
                    {editingProvider ? 'Guardar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
