'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { User, Phone, MapPin, Calendar, ShoppingCart, Search, TrendingUp } from 'lucide-react'
import { formatCurrency, getMinutesSince } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  defaultAddress: string | null
  addressHistory: string[]
  orderCount: number
  lastOrderDate: string | null
  totalSpent: number
  avgOrderValue: number
  createdAt: string
}

type CustomersResponse = { success: boolean; customers: Customer[] }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      const data: CustomersResponse = await res.json()
      if (data.success) {
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  )

  const stats = {
    totalCustomers: customers.length,
    activeToday: customers.filter((c) => {
      if (!c.lastOrderDate) return false
      const hoursSince = (Date.now() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60)
      return hoursSince < 24
    }).length,
    newThisWeek: customers.filter((c) => {
      const daysSince = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 7
    }).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    vipCustomers: customers.filter((c) => c.orderCount >= 10).length,
  }

  const getCustomerTier = (customer: Customer) => {
    if (customer.orderCount >= 20) return { label: 'VIP', color: 'bg-purple-100 text-purple-800' }
    if (customer.orderCount >= 10) return { label: 'Frecuente', color: 'bg-blue-100 text-blue-800' }
    if (customer.orderCount >= 5) return { label: 'Regular', color: 'bg-emerald-100 text-emerald-800' }
    return { label: 'Nuevo', color: 'bg-slate-100 text-slate-800' }
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
          <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 mt-1">Gestión de clientes y historial de pedidos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-80"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchCustomers}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalCustomers}</div>
                <div className="text-sm text-slate-500">Total Clientes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{stats.activeToday}</div>
                <div className="text-sm text-slate-500">Activos Hoy</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.vipCustomers}</div>
                <div className="text-sm text-slate-500">VIP</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{stats.newThisWeek}</div>
                <div className="text-sm text-slate-500">Nuevos (7 días)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
                <div className="text-sm text-slate-500">Ingresos Totales</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No se encontraron clientes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Contacto</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Dirección</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Pedidos</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Total Gastado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Último Pedido</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const tier = getCustomerTier(customer)
                    const daysSinceLastOrder = customer.lastOrderDate
                      ? Math.floor((Date.now() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
                      : null

                    return (
                      <tr
                        key={customer.id}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{customer.name}</p>
                              {customer.email && (
                                <p className="text-xs text-slate-500">{customer.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {customer.phone}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-sm max-w-xs">
                            <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{customer.defaultAddress || 'Sin dirección'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-slate-900">{customer.orderCount}</div>
                          <div className="text-xs text-slate-500">
                            Promedio: {formatCurrency(customer.avgOrderValue)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-bold text-slate-900">
                            {formatCurrency(customer.totalSpent)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {customer.lastOrderDate ? (
                            <div>
                              <div className="flex items-center gap-1 text-sm text-slate-600">
                                <Calendar className="h-3 w-3" />
                                {new Date(customer.lastOrderDate).toLocaleDateString()}
                              </div>
                              {daysSinceLastOrder !== null && (
                                <div className={`text-xs ${daysSinceLastOrder > 30 ? 'text-red-600' : 'text-slate-500'}`}>
                                  Hace {daysSinceLastOrder} días
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">Sin pedidos</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={tier.color}>{tier.label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedCustomer(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-200 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-slate-500" />
                  </div>
                  <div>
                    <CardTitle>{selectedCustomer.name}</CardTitle>
                    <p className="text-sm text-slate-500">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{selectedCustomer.orderCount}</div>
                  <div className="text-sm text-slate-500">Pedidos Totales</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{formatCurrency(selectedCustomer.totalSpent)}</div>
                  <div className="text-sm text-slate-500">Total Gastado</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">{formatCurrency(selectedCustomer.avgOrderValue)}</div>
                  <div className="text-sm text-slate-500">Ticket Promedio</div>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Direcciones</h3>
                <div className="space-y-2">
                  {selectedCustomer.addressHistory.map((address, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm p-2 bg-slate-50 rounded">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                      <span>{address}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Email:</span>
                  <p className="font-medium">{selectedCustomer.email || 'No registrado'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Cliente desde:</span>
                  <p className="font-medium">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-500">Último pedido:</span>
                  <p className="font-medium">
                    {selectedCustomer.lastOrderDate
                      ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString()
                      : 'Sin pedidos'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Nivel:</span>
                  <p className="font-medium">{getCustomerTier(selectedCustomer).label}</p>
                </div>
              </div>

              <Button className="w-full" onClick={() => setSelectedCustomer(null)}>
                Cerrar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
