'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, Shield, Search, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

interface StaffUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'CASHIER' | 'BARTENDER' | 'DRIVER'
  isActive: boolean
  phone: string | null
  createdAt: string
  orderCount?: number
}

type UsersResponse = { success: boolean; users: StaffUser[] }

type Role = 'ADMIN' | 'CASHIER' | 'BARTENDER' | 'DRIVER'

const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrador',
  CASHIER: 'Cajero',
  BARTENDER: 'Barista',
  DRIVER: 'Repartidor',
}

const roleColors: Record<Role, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  CASHIER: 'bg-blue-100 text-blue-800',
  BARTENDER: 'bg-amber-100 text-amber-800',
  DRIVER: 'bg-green-100 text-green-800',
}

export default function UsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER' as Role,
    phone: '',
    isActive: true,
  })

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data: UsersResponse = await res.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    newThisMonth: users.filter((u) => {
      const daysSince = (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 30
    }).length,
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'CASHIER',
      phone: '',
      isActive: true,
    })
    setShowModal(true)
  }

  const openEditModal = (user: StaffUser) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      isActive: user.isActive,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
    const method = editingUser ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        setShowModal(false)
        fetchUsers()
      } else {
        alert(data.error || 'Error al guardar usuario')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Error al guardar usuario')
    }
  }

  const handleToggleActive = async (user: StaffUser) => {
    if (!confirm(`¿${user.isActive ? 'Desactivar' : 'Activar'} usuario ${user.name}?`)) return

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, isActive: !user.isActive }),
      })

      const data = await res.json()
      if (data.success) {
        fetchUsers()
      } else {
        alert(data.error || 'Error al actualizar usuario')
      }
    } catch (error) {
      console.error('Error toggling user:', error)
      alert('Error al actualizar usuario')
    }
  }

  const handleDelete = async (user: StaffUser) => {
    if (!confirm(`¿Eliminar usuario ${user.name}? Esta acción no se puede deshacer.`)) return

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (data.success) {
        fetchUsers()
      } else {
        alert(data.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error al eliminar usuario')
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
          <h1 className="text-3xl font-bold text-slate-900">Personal</h1>
          <p className="text-slate-500 mt-1">Gestión de usuarios y roles del personal</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-80"
            />
          </div>
          <Button onClick={openCreateModal} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                <div className="text-sm text-slate-500">Total Personal</div>
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
                <div className="text-2xl font-bold text-emerald-600">{stats.activeUsers}</div>
                <div className="text-sm text-slate-500">Activos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
                <div className="text-sm text-slate-500">Administradores</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{stats.newThisMonth}</div>
                <div className="text-sm text-slate-500">Nuevos (30 días)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Personal ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Usuario</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Contacto</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Rol</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Fecha Creación</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">ID: {user.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="flex items-center gap-2"
                        >
                          {user.isActive ? (
                            <ToggleRight className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-slate-400" />
                          )}
                          <span className={`text-sm ${user.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-600">
                          {new Date(user.createdAt).toLocaleDateString('es-CL')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user)}
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
            className="w-full max-w-md max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">
                    Contraseña {editingUser ? '(dejar vacío para mantener)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    minLength={editingUser ? undefined : 6}
                  />
                </div>

                <div>
                  <Label htmlFor="role">Rol *</Label>
                  <Select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    required
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    Usuario activo
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
                    {editingUser ? 'Guardar' : 'Crear'}
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
