import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  // Si está autenticado, ir al dashboard
  if (session) {
    redirect('/dashboard')
  }

  // Si no está autenticado, ir a login
  redirect('/login')
}
