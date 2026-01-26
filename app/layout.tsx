import type { Metadata } from 'next'
import './globals.css'
import ServiceWorkerRegistration from '@/components/service-worker-registration'

export const metadata: Metadata = {
  title: 'kfe POS - Sistema de Gestión para Cafeterías',
  description: 'Sistema integral de gestión para cafeterías con POS, KDS e inventario',
  manifest: '/manifest.json',
  themeColor: '#ea580c',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'kfe POS',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
