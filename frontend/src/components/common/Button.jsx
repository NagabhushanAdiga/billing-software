export default function Button({ children, variant = 'primary', type = 'button', className = '', ...props }) {
  const base = 'px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 focus:ring-offset-white'
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-400',
    secondary: 'bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-400',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
  }
  return (
    <button
      type={type}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
