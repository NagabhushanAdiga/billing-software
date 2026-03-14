import { IoStorefront } from 'react-icons/io5'
import LoginForm from './LoginForm'

export default function LoginPage({ onSuccess }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center">
        <div className="flex items-center justify-center gap-2 text-emerald-600">
          <IoStorefront className="w-10 h-10 sm:w-12 sm:h-12" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            SuperMart Billing
          </h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">Supermarket POS • Role-based login</p>
      </div>
      <div className="relative z-10 w-full flex justify-center">
        <LoginForm onSuccess={onSuccess} />
      </div>
    </div>
  )
}
