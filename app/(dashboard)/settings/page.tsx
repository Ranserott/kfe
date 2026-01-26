'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Settings,
  Store,
  Clock,
  DollarSign,
  Bell,
  Printer,
  Monitor,
  Save,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'

interface SystemSettings {
  // Store settings
  storeName: string
  storeAddress: string
  storePhone: string
  storeEmail: string
  currency: string
  taxRate: number

  // Operating hours
  openingTime: string
  closingTime: string
  daysOpen: string[]

  // Delivery settings
  defaultDeliveryFee: number
  defaultDeliveryTime: number
  maxDeliveryDistance: number
  enableDelivery: boolean

  // Order settings
  autoAcceptOrders: boolean
  requireTableForDineIn: boolean
  allowPartialPayments: boolean

  // Notification settings
  enableLowStockAlerts: boolean
  lowStockThreshold: number
  enableLateOrderAlerts: boolean
  lateOrderMinutes: number

  // KDS settings
  kdsRefreshInterval: number
  showPrepTime: boolean
  autoReadyOrders: boolean

  // Receipt settings
  receiptFooter: string
  printReceipts: boolean
}

const defaultSettings: SystemSettings = {
  storeName: 'kfe Café',
  storeAddress: '',
  storePhone: '',
  storeEmail: '',
  currency: 'ARS',
  taxRate: 21,

  openingTime: '08:00',
  closingTime: '22:00',
  daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],

  defaultDeliveryFee: 1500,
  defaultDeliveryTime: 30,
  maxDeliveryDistance: 5,
  enableDelivery: true,

  autoAcceptOrders: false,
  requireTableForDineIn: true,
  allowPartialPayments: false,

  enableLowStockAlerts: true,
  lowStockThreshold: 10,
  enableLateOrderAlerts: true,
  lateOrderMinutes: 15,

  kdsRefreshInterval: 2,
  showPrepTime: true,
  autoReadyOrders: false,

  receiptFooter: '¡Gracias por su visita!',
  printReceipts: false,
}

const daysOfWeek = [
  { value: 'Mon', label: 'Lunes' },
  { value: 'Tue', label: 'Martes' },
  { value: 'Wed', label: 'Miércoles' },
  { value: 'Thu', label: 'Jueves' },
  { value: 'Fri', label: 'Viernes' },
  { value: 'Sat', label: 'Sábado' },
  { value: 'Sun', label: 'Domingo' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setSaved(true)
        setHasChanges(false)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('¿Restablecer configuración por defecto?')) {
      setSettings(defaultSettings)
      setHasChanges(true)
    }
  }

  const updateSetting = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configuración del Sistema</h1>
          <p className="text-slate-500 mt-1">Ajustes generales de kfe POS</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="warning" className="px-3 py-1">
              Hay cambios sin guardar
            </Badge>
          )}
          {saved && (
            <Badge variant="success" className="px-3 py-1">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Guardado
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Restablecer
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? (
              'Guardando...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Información del Local
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre del Local</Label>
              <Input
                value={settings.storeName}
                onChange={(e) => updateSetting('storeName', e.target.value)}
                placeholder="kfe Café"
              />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input
                value={settings.storeAddress}
                onChange={(e) => updateSetting('storeAddress', e.target.value)}
                placeholder="Calle 123, Ciudad"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={settings.storePhone}
                  onChange={(e) => updateSetting('storePhone', e.target.value)}
                  placeholder="+54 11 1234-5678"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={settings.storeEmail}
                  onChange={(e) => updateSetting('storeEmail', e.target.value)}
                  placeholder="contacto@cafe.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Moneda</Label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSetting('currency', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="ARS">ARS - Peso Argentino</option>
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              <div>
                <Label>Tasa de Impuesto (%)</Label>
                <Input
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horario de Atención
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Apertura</Label>
                <Input
                  type="time"
                  value={settings.openingTime}
                  onChange={(e) => updateSetting('openingTime', e.target.value)}
                />
              </div>
              <div>
                <Label>Cierre</Label>
                <Input
                  type="time"
                  value={settings.closingTime}
                  onChange={(e) => updateSetting('closingTime', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="mb-2">Días de Apertura</Label>
              <div className="grid grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => {
                      const newDays = settings.daysOpen.includes(day.value)
                        ? settings.daysOpen.filter((d) => d !== day.value)
                        : [...settings.daysOpen, day.value]
                      updateSetting('daysOpen', newDays)
                    }}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${settings.daysOpen.includes(day.value)
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }
                    `}
                  >
                    {day.label.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Configuración de Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Habilitar Delivery</Label>
                <p className="text-sm text-slate-500">Permite recibir pedidos a domicilio</p>
              </div>
              <Switch
                checked={settings.enableDelivery}
                onCheckedChange={(checked) => updateSetting('enableDelivery', checked)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Costo de Delivery Base</Label>
                <Input
                  type="number"
                  value={settings.defaultDeliveryFee}
                  onChange={(e) => updateSetting('defaultDeliveryFee', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Tiempo Estimado (min)</Label>
                <Input
                  type="number"
                  value={settings.defaultDeliveryTime}
                  onChange={(e) => updateSetting('defaultDeliveryTime', parseInt(e.target.value) || 30)}
                />
              </div>
            </div>
            <div>
              <Label>Distancia Máxima (km)</Label>
              <Input
                type="number"
                value={settings.maxDeliveryDistance}
                onChange={(e) => updateSetting('maxDeliveryDistance', parseFloat(e.target.value) || 5)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Órdenes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-aceptar Órdenes</Label>
                <p className="text-sm text-slate-500">Las órdenes se aceptan automáticamente</p>
              </div>
              <Switch
                checked={settings.autoAcceptOrders}
                onCheckedChange={(checked) => updateSetting('autoAcceptOrders', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Requerir Mesa para "En Local"</Label>
                <p className="text-sm text-slate-500">Obliga seleccionar mesa para dine-in</p>
              </div>
              <Switch
                checked={settings.requireTableForDineIn}
                onCheckedChange={(checked) => updateSetting('requireTableForDineIn', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Permitir Pagos Parciales</Label>
                <p className="text-sm text-slate-500">Permite abonar en varias partes</p>
              </div>
              <Switch
                checked={settings.allowPartialPayments}
                onCheckedChange={(checked) => updateSetting('allowPartialPayments', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas y Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Alertas de Stock Bajo</Label>
                <p className="text-sm text-slate-500">Notifica cuando el stock es bajo</p>
              </div>
              <Switch
                checked={settings.enableLowStockAlerts}
                onCheckedChange={(checked) => updateSetting('enableLowStockAlerts', checked)}
              />
            </div>
            {settings.enableLowStockAlerts && (
              <div>
                <Label>Umbral de Stock Bajo (%)</Label>
                <Input
                  type="number"
                  value={settings.lowStockThreshold}
                  onChange={(e) => updateSetting('lowStockThreshold', parseFloat(e.target.value) || 10)}
                  min={0}
                  max={100}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <Label>Alertas de Órdenes Atrasadas</Label>
                <p className="text-sm text-slate-500">Notifica órdenes que tardan mucho</p>
              </div>
              <Switch
                checked={settings.enableLateOrderAlerts}
                onCheckedChange={(checked) => updateSetting('enableLateOrderAlerts', checked)}
              />
            </div>
            {settings.enableLateOrderAlerts && (
              <div>
                <Label>Minutos para Alerta de Atraso</Label>
                <Input
                  type="number"
                  value={settings.lateOrderMinutes}
                  onChange={(e) => updateSetting('lateOrderMinutes', parseInt(e.target.value) || 15)}
                  min={1}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* KDS Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Configuración de KDS (Cocina)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Intervalo de Actualización (segundos)</Label>
              <Input
                type="number"
                value={settings.kdsRefreshInterval}
                onChange={(e) => updateSetting('kdsRefreshInterval', parseInt(e.target.value) || 2)}
                min={1}
                max={60}
              />
              <p className="text-xs text-slate-500 mt-1">Menor valor = más actualizaciones, más uso de red</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Mostrar Tiempo de Preparación</Label>
                <p className="text-sm text-slate-500">Muestra el tiempo en KDS</p>
              </div>
              <Switch
                checked={settings.showPrepTime}
                onCheckedChange={(checked) => updateSetting('showPrepTime', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-marcar como Listas</Label>
                <p className="text-sm text-slate-500">Las órdenes se marcan listas automáticamente</p>
              </div>
              <Switch
                checked={settings.autoReadyOrders}
                onCheckedChange={(checked) => updateSetting('autoReadyOrders', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Configuración de Comprobantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Imprimir Comprobantes</Label>
                <p className="text-sm text-slate-500">Imprime automáticamente al cerrar orden</p>
              </div>
              <Switch
                checked={settings.printReceipts}
                onCheckedChange={(checked) => updateSetting('printReceipts', checked)}
              />
            </div>
            <div>
              <Label>Pie de Página del Comprobante</Label>
              <Input
                value={settings.receiptFooter}
                onChange={(e) => updateSetting('receiptFooter', e.target.value)}
                placeholder="¡Gracias por su visita!"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
