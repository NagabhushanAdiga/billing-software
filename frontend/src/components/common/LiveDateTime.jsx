import { useEffect, useState } from 'react'

export default function LiveDateTime({ className = '' }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
  const date = now.toLocaleDateString([], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className={`text-right shrink-0 ${className}`}>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">{time}</p>
      <p className="text-slate-500 text-sm mt-1">{date}</p>
    </div>
  )
}
