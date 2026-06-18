import { HiOutlineTicket } from 'react-icons/hi'
import TicketCard from './TicketCard'

export default function TicketList({ tickets, filter, canManageStatus, onStatusChange }) {
  const filtered =
    filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)

  if (filtered.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 py-16 px-4 text-center bg-white/60">
        <div className="inline-flex w-14 h-14 rounded-md bg-sky-50 items-center justify-center mb-3">
          <HiOutlineTicket className="w-7 h-7 text-sky-500" />
        </div>
        <p className="text-slate-600 text-sm font-medium">
          {tickets.length === 0 ? 'No tickets raised yet.' : 'No tickets in this filter.'}
        </p>
        <p className="text-slate-400 text-xs mt-1">
          {tickets.length === 0 ? 'Use Raise ticket to get help from support.' : 'Try another filter tab.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filtered.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          canManageStatus={canManageStatus}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  )
}
