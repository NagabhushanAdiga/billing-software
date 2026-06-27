import { useEffect, useState } from 'react'
import { buildInvoicePreviewHtml } from '../../utils/generateInvoicePdf'

export default function InvoicePreview({ settings, order, className = '' }) {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    buildInvoicePreviewHtml(settings, order)
      .then((content) => {
        if (!cancelled) {
          setHtml(content)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [settings, order])

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-16 text-slate-500 text-sm ${className}`}>
        Preparing invoice…
      </div>
    )
  }

  if (!html) {
    return (
      <div className={`flex items-center justify-center py-16 text-slate-500 text-sm ${className}`}>
        Could not load invoice preview.
      </div>
    )
  }

  return (
    <div
      className={`invoice-preview-root bg-white rounded-lg overflow-hidden shadow-inner border border-slate-200 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
