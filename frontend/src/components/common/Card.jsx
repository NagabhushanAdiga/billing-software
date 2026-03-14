export default function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl bg-white border border-gray-300 shadow-md ${className}`}>
      {children}
    </div>
  )
}
