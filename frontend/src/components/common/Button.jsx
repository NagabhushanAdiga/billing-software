export default function Button({ children, variant = 'primary', type = 'button', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none focus:ring-offset-violet-50 active:scale-[0.98]'
  const variants = {
    primary:
      'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/45 hover:from-violet-500 hover:via-fuchsia-500 hover:to-pink-500 focus:ring-fuchsia-400',
    secondary:
      'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-blue-500/25 hover:from-indigo-500 hover:to-blue-500 focus:ring-blue-400',
    danger:
      'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25 hover:from-red-400 hover:to-orange-400 focus:ring-red-400',
    ghost:
      'bg-transparent text-violet-700 hover:bg-violet-50 hover:text-violet-900 focus:ring-violet-300 shadow-none',
    outline:
      'bg-white text-violet-800 border-2 border-violet-200 shadow-sm hover:bg-violet-50 hover:border-violet-300 focus:ring-violet-300',
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
