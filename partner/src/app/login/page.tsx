import { Suspense } from 'react'
import { LoginForm } from './LoginForm'
import { Logo } from '@/components/Logo'
import { Card } from '@/components/ui'

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center px-6 py-16">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Card className="p-8">
          <Suspense fallback={<div className="h-[280px]" />}>
            <LoginForm />
          </Suspense>
        </Card>
      </div>
    </main>
  )
}
