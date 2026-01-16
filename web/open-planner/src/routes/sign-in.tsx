import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/clerk-react'

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-fuchsia-500/50">
            <span className="text-white font-black text-2xl">F</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            Welcome <span className="gradient-text">Back</span>
          </h1>
          <p className="text-slate-400">Sign in to manage your finances</p>
        </div>

        {/* Sign-in form */}
        <div className="glass border border-white/10 rounded-2xl p-2 shadow-2xl animate-fadeIn">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'bg-transparent shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-white/10 hover:bg-white/20 border border-white/20 text-white',
                formButtonPrimary: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-violet-600/30',
                formFieldInput: 'bg-white/5 border-white/20 text-white focus:ring-violet-500/50',
                footerActionLink: 'text-violet-400 hover:text-violet-300',
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
