import { useRef, useEffect } from 'react'
import Input from '../common/Input'

export default function BarcodeInput({ onScan, placeholder = 'Scan or enter barcode' }) {
  const inputRef = useRef(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        const value = (el.value || '').trim()
        if (value) {
          onScan?.(value)
          el.value = ''
        }
      }
    }
    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [onScan])

  return (
    <Input
      ref={inputRef}
      placeholder={placeholder}
      className="barcode-input"
      autoFocus
    />
  )
}
