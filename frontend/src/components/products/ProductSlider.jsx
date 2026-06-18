import { useEffect, useRef } from 'react'
import Button from '../common/Button'
import ProductForm, { PRODUCT_FORM_ID } from './ProductForm'
import { useAsyncAction, delay } from '../../hooks/useAsyncAction'

export default function ProductSlider({ open, product, onSubmit, onCancel }) {
  const panelRef = useRef(null)
  const closeBtnRef = useRef(null)
  const { loading, run } = useAsyncAction()

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
      const firstField = panelRef.current.querySelector(
        'form input:not([type="file"]):not([type="hidden"]), form select'
      )
      if (firstField) {
        requestAnimationFrame(() => firstField.focus())
      } else {
        closeBtnRef.current?.focus()
      }
    }
  }, [open, product])

  const handleSubmit = (data) => {
    run(async () => {
      await delay(350)
      onSubmit?.(data)
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
        aria-labelledby="product-slider-title"
      >
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <h2 id="product-slider-title" className="text-lg font-bold text-slate-900">
            {product ? 'Edit product' : 'Add product'}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onCancel}
            onKeyDown={(e) => e.key === 'Enter' && onCancel?.()}
            className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Close (Escape)"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-5 sm:p-6">
          <ProductForm
            product={product}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            inSlider
            formId={PRODUCT_FORM_ID}
          />
        </div>

        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 bg-white flex gap-2 shadow-[0_-4px_24px_rgba(15,23,42,0.06)]">
          <Button type="submit" form={PRODUCT_FORM_ID} className="flex-1" loading={loading} disabled={loading}>
            {product ? 'Update product' : 'Add product'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  )
}
