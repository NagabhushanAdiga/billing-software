import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { getDb, closeDb } from '../config/db.js'

dotenv.config()

const db = getDb()

const INITIAL_GROUPS = [
  { id: 'grp-grocery', name: 'Grocery' },
  { id: 'grp-daily', name: 'Daily products' },
  { id: 'grp-dairy', name: 'Dairy' },
  { id: 'grp-personal', name: 'Personal Care' },
  { id: 'grp-hardware', name: 'Hardware' },
  { id: 'grp-other', name: 'Other' },
]

const INITIAL_SUBCATEGORIES = [
  { id: 'sub-milk', group_id: 'grp-daily', name: 'Milk products' },
  { id: 'sub-bread', group_id: 'grp-daily', name: 'Breads' },
]

const INITIAL_BATCHES = [
  { id: 'bat-2024-a', name: 'Batch 2024-A' },
  { id: 'bat-2024-b', name: 'Batch 2024-B' },
]

const groupByCategory = {
  Grocery: 'grp-grocery',
  Dairy: 'grp-dairy',
  'Daily products': 'grp-daily',
  'Personal Care': 'grp-personal',
  Hardware: 'grp-hardware',
  Other: 'grp-other',
}

const INITIAL_PRODUCTS = [
  ['1', '8901234567890', 'Rice 1kg', 65, 'Grocery', 0, 120],
  ['2', '8901234567891', 'Dal 500g', 120, 'Grocery', 0, 80],
  ['3', '8901234567892', 'Cooking Oil 1L', 180, 'Grocery', 0, 45],
  ['4', '8901234567893', 'Soap Bar', 40, 'Personal Care', 5, 200],
  ['5', '8901234567894', 'Milk 1L', 55, 'Dairy', 0, 60],
  ['6', '8901234567895', 'Tea 500g', 220, 'Grocery', 0, 35],
  ['7', '8901234567896', 'Sugar 1kg', 48, 'Grocery', 0, 90],
  ['8', '8901234567897', 'Wheat Flour 1kg', 35, 'Grocery', 0, 100],
  ['9', '8901234567898', 'Shampoo 200ml', 145, 'Personal Care', 10, 40],
  ['10', '8901234567899', 'Toothpaste', 85, 'Personal Care', 0, 75],
  ['11', '8901234567800', 'Bulb 9W LED', 95, 'Hardware', 0, 150],
  ['12', '8901234567801', 'Wire 1.5mm 90m', 450, 'Hardware', 0, 12],
  ['13', '8901234567802', 'Switch Single', 65, 'Hardware', 0, 85],
  ['14', '8901234567803', 'Socket 6A', 120, 'Hardware', 0, 55],
  ['15', '8901234567804', 'Screwdriver Set', 180, 'Hardware', 0, 25],
  ['16', '8901234567805', 'Nails 500g', 55, 'Hardware', 0, 110],
  ['17', '8901234567806', 'Adhesive Tape', 30, 'Hardware', 0, 200],
  ['18', '8901234567807', 'Battery 9V', 45, 'Hardware', 0, 95],
]

const INITIAL_USERS = []

function seedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c
  if (userCount > 0) {
    console.log('Database already seeded — skipping.')
    closeDb()
    return
  }

  const adminUsername = String(process.env.INITIAL_ADMIN_USERNAME || 'naga').trim().toLowerCase()
  const adminPassword = String(process.env.INITIAL_ADMIN_PASSWORD || '12345').trim()
  const adminName = String(process.env.INITIAL_ADMIN_NAME || 'Naga').trim()

  if (adminPassword.length < 4) {
    console.warn(
      'No admin user created. Set INITIAL_ADMIN_PASSWORD in backend/.env (min 4 characters), then run npm run db:reset.'
    )
  } else {
    const insertUser = db.prepare(
      'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)'
    )
    insertUser.run(
      'usr-admin',
      adminUsername,
      bcrypt.hashSync(adminPassword, 10),
      adminName,
      'admin'
    )
  }

  const insertGroup = db.prepare('INSERT INTO groups (id, name) VALUES (?, ?)')
  for (const g of INITIAL_GROUPS) {
    insertGroup.run(g.id, g.name)
  }

  const insertSub = db.prepare(
    'INSERT INTO subcategories (id, group_id, name) VALUES (?, ?, ?)'
  )
  for (const s of INITIAL_SUBCATEGORIES) {
    insertSub.run(s.id, s.group_id, s.name)
  }

  const insertBatch = db.prepare('INSERT INTO batches (id, name) VALUES (?, ?)')
  for (const b of INITIAL_BATCHES) {
    insertBatch.run(b.id, b.name)
  }

  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, barcode, name, hsn, gst, group_id, category, discount, price, stock, image, batches_json
    ) VALUES (?, ?, ?, '', 0, ?, ?, ?, ?, ?, ?, '[]')
  `)
  for (const [id, barcode, name, price, category, discount, stock] of INITIAL_PRODUCTS) {
    const groupId = groupByCategory[category] || 'grp-other'
    insertProduct.run(
      id,
      barcode,
      name,
      groupId,
      category,
      discount,
      price,
      stock,
      `https://picsum.photos/seed/${id}/200/200`
    )
  }

  db.prepare(`
    INSERT INTO settings (id) VALUES (1)
  `).run()

  const adminActor = {
    id: 'usr-admin',
    username: adminUsername,
    name: adminName,
    role: 'admin',
  }
  const now = Date.now()

  db.prepare(`
    INSERT INTO orders (
      id, date, created_by_id, created_by_json, items_json,
      gross_subtotal, discount_total, subtotal, tax, total_before_bill_discount,
      bill_discount, bill_discount_type, bill_discount_amount, total
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'amount', 0, ?)
  `).run(
    'ord-001',
    new Date(now - 86400000).toISOString(),
    'usr-admin',
    JSON.stringify(adminActor),
    JSON.stringify([
      { name: 'Rice 1kg', barcode: '8901234567890', price: 65, qty: 2 },
      { name: 'Dal 500g', barcode: '8901234567891', price: 120, qty: 1 },
    ]),
    250, 0, 250, 12.5, 262.5, 262.5
  )

  db.prepare(`
    INSERT INTO orders (
      id, date, created_by_id, created_by_json, items_json,
      gross_subtotal, discount_total, subtotal, tax, total_before_bill_discount,
      bill_discount, bill_discount_type, bill_discount_amount, total
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'amount', 0, ?)
  `).run(
    'ord-002',
    new Date(now - 3600000).toISOString(),
    'usr-admin',
    JSON.stringify(adminActor),
    JSON.stringify([
      { name: 'Bulb 9W LED', barcode: '8901234567800', price: 95, qty: 3 },
      { name: 'Switch Single', barcode: '8901234567802', price: 65, qty: 2 },
    ]),
    415, 0, 415, 20.75, 435.75, 435.75
  )

  console.log('Database seeded.')
  closeDb()
}

seedIfEmpty()
