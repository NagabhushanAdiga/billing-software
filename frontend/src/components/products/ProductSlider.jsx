import { useEffect, useRef } from 'react'
import { HiOutlineCube } from 'react-icons/hi'
import ProductForm, { PRODUCT_FORM_ID } from './ProductForm'
import FormActions from '../common/FormActions'
import SliderPanelHeader from '../common/SliderPanelHeader'
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
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out cursor-pointer ${
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
        <SliderPanelHeader
          titleId="product-slider-title"
          title={product ? 'Edit product' : 'Add product'}
          subtitle={product ? 'Update details, stock, and category' : 'Barcode is generated automatically'}
          icon={HiOutlineCube}
          onClose={onCancel}
          closeRef={closeBtnRef}
          closeLabel="Close (Escape)"
          borderClass="border-orange-200/80"
          gradientClass="from-amber-500 via-orange-500 to-amber-600"
          subtitleClass="text-amber-50/90"
        />

        <div className="flex-1 min-h-0 overflow-auto p-5 sm:p-6">
          <ProductForm
            product={product}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            inSlider
            formId={PRODUCT_FORM_ID}
          />
        </div>

        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.06)]">
          <FormActions
            onCancel={onCancel}
            primaryLabel={product ? 'Update product' : 'Add product'}
            primaryForm={PRODUCT_FORM_ID}
            loading={loading}
            disabled={loading}
          />
        </div>
      </div>
    </>
  )
}
