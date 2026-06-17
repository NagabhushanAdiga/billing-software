import Button from './Button'
import Card from './Card'

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="p-6 max-w-sm w-full shadow-2xl">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        {message && <p className="text-slate-500 text-sm mb-5 leading-relaxed">{message}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </Card>
    </div>
  )
}
