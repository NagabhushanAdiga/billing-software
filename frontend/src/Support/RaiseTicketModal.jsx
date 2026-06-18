import { useEffect, useRef, useState } from 'react'
import { HiOutlineSupport, HiOutlineX } from 'react-icons/hi'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from './constants'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'

const FORM_ID = 'raise-ticket-form'

export default function RaiseTicketModal({ open, onSubmit, onClose }) {
  const panelRef = useRef(null)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('billing')
  const [priority, setPriority] = useState('medium')
  const [errors, setErrors] = useState({})
  const { loading, run } = useAsyncAction()

  useEffect(() => {
    if (!open) return
    setSubject('')
    setDescription('')
    setCategory('billing')
    setPriority('medium')
    setErrors({})
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  useEffect(() => {
    if (open && panelRef.current) {
      const field = panelRef.current.querySelector('form input')
      requestAnimationFrame(() => field?.focus())
    }
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!subject.trim()) nextErrors.subject = 'Subject is required'
    if (!description.trim()) nextErrors.description = 'Please describe the issue'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    run(async () => {
      await delay(350)
      onSubmit?.({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
      })
      onClose?.()
    })
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-full sm:max-w-lg bg-slate-50 border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="raise-ticket-title"
      >
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex items-center gap-4 shrink-0">
          <div className="w-11 h-11 rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
            <HiOutlineSupport className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="raise-ticket-title" className="text-lg font-bold text-slate-900">Raise a ticket</h2>
            <p className="text-slate-500 text-sm mt-0.5">We&apos;ll track your request here</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Close"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-5 sm:p-6">
          <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Subject"
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setErrors((er) => ({ ...er, subject: '' })) }}
              placeholder="Brief summary of the issue"
              error={errors.subject}
              required
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="field-select"
              >
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="field-select"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); setErrors((er) => ({ ...er, description: '' })) }}
                placeholder="What happened? Include steps to reproduce if possible."
                rows={5}
                className={`field-input resize-y min-h-[120px] ${errors.description ? 'field-input-error' : ''}`}
                required
              />
              {errors.description && <p className="mt-1.5 text-sm text-red-600">{errors.description}</p>}
            </div>
          </form>
        </div>

        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 bg-white flex gap-2">
          <Button type="submit" form={FORM_ID} className="flex-1" loading={loading} disabled={loading}>
            Submit ticket
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  )
}
