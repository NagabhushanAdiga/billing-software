import { useEffect, useRef } from 'react'
import ProductForm from './ProductForm'

export default function ProductSlider({ open, product, onSubmit, onCancel }) {
  const panelRef = useRef(null)
  const closeBtnRef = useRef(null)

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
      const firstField = panelRef.current.querySelector('form input, form select')
      if (firstField) {
        requestAnimationFrame(() => firstField.focus())
      } else {
        closeBtnRef.current?.focus()
      }
    }
  }, [open, product])

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ease-out ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-slider-title"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 id="product-slider-title" className="text-lg font-semibold text-gray-900">
            {product ? 'Edit product' : 'Add product'}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onCancel}
            onKeyDown={(e) => e.key === 'Enter' && onCancel?.()}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Close (Escape)"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <ProductForm
            product={product}
            onSubmit={onSubmit}
            onCancel={onCancel}
            inSlider
          />
        </div>
      </div>
    </>
  )
}
