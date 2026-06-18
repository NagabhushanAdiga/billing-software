import { useEffect, useRef, useState } from 'react'
import { HiOutlineCollection } from 'react-icons/hi'
import Button from '../common/Button'
import Input from '../common/Input'
import { useAsyncAction, delay } from '../../hooks/useAsyncAction'

const FORM_ID = 'add-group-form'

export default function GroupSlider({ open, onSubmit, onCancel }) {
  const panelRef = useRef(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const { loading, run } = useAsyncAction()

  useEffect(() => {
    if (open) {
      setName('')
      setError('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onCancel])

  useEffect(() => {
    if (open && panelRef.current) {
      const field = panelRef.current.querySelector('form input')
      requestAnimationFrame(() => field?.focus())
    }
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Group name is required.')
      return
    }
    run(async () => {
      await delay(300)
      const result = onSubmit?.(trimmed)
      if (result === null) {
        setError('A group with this name already exists.')
        return
      }
      setName('')
      setError('')
    })
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-full sm:max-w-md bg-white border-l border-slate-200/80 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-slider-title"
      >
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-slate-50/50">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <HiOutlineCollection className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="group-slider-title" className="text-lg font-bold text-slate-900">Add group</h2>
            <p className="text-slate-500 text-sm mt-0.5">Create a new product group</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-5 sm:p-6">
          <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Group name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="e.g. Beverages, Snacks, Electronics"
              required
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
            )}
          </form>
        </div>

        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 bg-white flex gap-2 shadow-[0_-4px_24px_rgba(15,23,42,0.06)]">
          <Button type="submit" form={FORM_ID} className="flex-1" loading={loading} disabled={loading}>
            Add group
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  )
}
