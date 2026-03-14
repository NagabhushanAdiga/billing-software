// Static initial data for the billing app

export const INITIAL_PRODUCTS = [
  { id: '1', barcode: '8901234567890', name: 'Rice 1kg', price: 65, category: 'Grocery' },
  { id: '2', barcode: '8901234567891', name: 'Dal 500g', price: 120, category: 'Grocery' },
  { id: '3', barcode: '8901234567892', name: 'Cooking Oil 1L', price: 180, category: 'Grocery' },
  { id: '4', barcode: '8901234567893', name: 'Soap Bar', price: 40, category: 'Personal Care' },
  { id: '5', barcode: '8901234567894', name: 'Milk 1L', price: 55, category: 'Dairy' },
  { id: '6', barcode: '8901234567895', name: 'Tea 500g', price: 220, category: 'Grocery' },
  { id: '7', barcode: '8901234567896', name: 'Sugar 1kg', price: 48, category: 'Grocery' },
  { id: '8', barcode: '8901234567897', name: 'Wheat Flour 1kg', price: 35, category: 'Grocery' },
  { id: '9', barcode: '8901234567898', name: 'Shampoo 200ml', price: 145, category: 'Personal Care' },
  { id: '10', barcode: '8901234567899', name: 'Toothpaste', price: 85, category: 'Personal Care' },
  { id: '11', barcode: '8901234567800', name: 'Bulb 9W LED', price: 95, category: 'Hardware' },
  { id: '12', barcode: '8901234567801', name: 'Wire 1.5mm 90m', price: 450, category: 'Hardware' },
  { id: '13', barcode: '8901234567802', name: 'Switch Single', price: 65, category: 'Hardware' },
  { id: '14', barcode: '8901234567803', name: 'Socket 6A', price: 120, category: 'Hardware' },
  { id: '15', barcode: '8901234567804', name: 'Screwdriver Set', price: 180, category: 'Hardware' },
  { id: '16', barcode: '8901234567805', name: 'Nails 500g', price: 55, category: 'Hardware' },
  { id: '17', barcode: '8901234567806', name: 'Adhesive Tape', price: 30, category: 'Hardware' },
  { id: '18', barcode: '8901234567807', name: 'Battery 9V', price: 45, category: 'Hardware' },
]

export const DEFAULT_SETTINGS = {
  storeName: 'SuperMart Billing',
  taxRate: 5,
  currency: '₹',
}

// Sample past orders for initial report data
export const SAMPLE_ORDERS = [
  {
    id: 'ord-001',
    date: new Date(Date.now() - 86400000).toISOString(),
    items: [
      { name: 'Rice 1kg', barcode: '8901234567890', price: 65, qty: 2 },
      { name: 'Dal 500g', barcode: '8901234567891', price: 120, qty: 1 },
    ],
    subtotal: 250,
    tax: 12.5,
    total: 262.5,
  },
  {
    id: 'ord-002',
    date: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { name: 'Bulb 9W LED', barcode: '8901234567800', price: 95, qty: 3 },
      { name: 'Switch Single', barcode: '8901234567802', price: 65, qty: 2 },
    ],
    subtotal: 415,
    tax: 20.75,
    total: 435.75,
  },
]
