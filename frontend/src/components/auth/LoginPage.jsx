import { IoStorefront } from 'react-icons/io5'
import LoginForm from './LoginForm'
import Card from '../common/Card'
import { Shimmer, ShimmerLine } from '../common/Shimmer'
import { usePageLoading } from '../../hooks/usePageLoading'

function LoginSkeleton() {
  return (
    <Card className="p-8 w-full max-w-md shadow-2xl border-2 border-violet-200/50">
      <div className="space-y-5">
        <div className="text-center space-y-2 mb-2">
          <ShimmerLine className="h-7 w-40 mx-auto" />
          <ShimmerLine className="h-4 w-32 mx-auto" />
        </div>
        <Shimmer className="h-11 w-full rounded-xl" />
        <Shimmer className="h-11 w-full rounded-xl" />
        <Shimmer className="h-11 w-full rounded-xl" />
      </div>
    </Card>
  )
}

export default function LoginPage({ onSuccess }) {
  const loading = usePageLoading(true, 400)

  return (
    <div className="login-shell min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-16 w-80 h-80 bg-sky-400/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 left-1/4 w-96 h-96 bg-fuchsia-500/25 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 via-sky-500 to-fuchsia-500 text-white shadow-2xl shadow-fuchsia-500/40 mb-5 ring-4 ring-white/20">
          <IoStorefront className="w-10 h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
          SuperMart Billing
        </h1>
        <p className="text-violet-200 text-sm mt-2 font-medium">Colourful · Fast · Easy billing</p>
      </div>

      <div className="relative z-10 w-full flex justify-center">
        {loading ? <LoginSkeleton /> : <LoginForm onSuccess={onSuccess} />}
      </div>
    </div>
  )
}
