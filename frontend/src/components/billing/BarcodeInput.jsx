import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { HiOutlineQrcode } from 'react-icons/hi'
import Input from '../common/Input'

const BarcodeInput = forwardRef(function BarcodeInput(
  { onScan, placeholder = 'Scan or enter barcode', active = true },
  ref
) {
  const inputRef = useRef(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }))

  useEffect(() => {
    if (!active) return
    inputRef.current?.focus()
  }, [active])

  useEffect(() => {
    if (!active) return

    const refocusIfAllowed = (e) => {
      const target = e.target
      if (target?.closest?.('[role="dialog"]')) return
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }
      inputRef.current?.focus()
    }

    window.addEventListener('click', refocusIfAllowed)
    return () => window.removeEventListener('click', refocusIfAllowed)
  }, [active])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        const value = (el.value || '').trim()
        if (value) {
          e.preventDefault()
          onScan?.(value)
          el.value = ''
        }
      }
    }

    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [onScan])

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="text-sm font-bold text-slate-800">Scan or search</label>
        {active && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700 bg-gradient-to-r from-violet-100 to-fuchsia-100 px-2.5 py-0.5 rounded-full border border-violet-200">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            Ready
          </span>
        )}
      </div>
      <div className="relative">
        <HiOutlineQrcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500 pointer-events-none z-10" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          className="barcode-input"
          inputClassName="!pl-12 !py-3.5 !text-base"
          autoFocus={active}
          data-barcode-input
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <p className="text-xs text-slate-400 mt-2">Scanner, barcode, or product name — press Enter to add</p>
    </div>
  )
})

export default BarcodeInput
