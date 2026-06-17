import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, hint, error, className = '', inputClassName = '', ...props },
  ref
) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      {hint && !error && <p className="text-xs text-slate-400 mb-1.5 -mt-1">{hint}</p>}
      <input
        ref={ref}
        className={`field-input ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''} ${inputClassName}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  )
})

export default Input

