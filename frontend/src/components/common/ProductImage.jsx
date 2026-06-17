import { productImageSrc } from '../../utils/productImage'

export default function ProductImage({ product, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-10 h-10 rounded-lg',
    md: 'w-12 h-12 rounded-xl',
    lg: 'w-16 h-16 rounded-xl',
  }
  const src = productImageSrc(product)
  const name = product?.name || '?'

  return (
    <img
      src={src}
      alt={name}
      className={`object-cover bg-slate-100 border border-slate-200/80 shrink-0 ${sizes[size] || sizes.md} ${className}`}
      onError={(e) => {
        e.currentTarget.onerror = null
        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=128`
      }}
    />
  )
}
