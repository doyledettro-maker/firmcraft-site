import { SignIn } from '@clerk/nextjs'
import { Logo } from '@/components/Logo'

export const metadata = { title: 'Sign in · Firmcraft Admin' }

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center px-6 py-16">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="eyebrow text-center mb-2">Internal admin</div>
        <h1 className="font-sans font-semibold text-[32px] tracking-[-0.02em] text-center mb-1">
          Sign <em className="text-signal not-italic">in</em>
        </h1>
        <p className="text-ink-2 text-[14px] leading-relaxed text-center mb-6 max-w-[360px] mx-auto">
          Restricted to Firmcraft staff.
        </p>
        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/login"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none border border-line rounded-2xl bg-paper',
              },
            }}
          />
        </div>
      </div>
    </main>
  )
}
