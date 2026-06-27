import { useMemo, useState, useEffect, Fragment } from 'react'
import {
  HiOutlineCollection,
  HiOutlinePlusCircle,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlinePencil,
} from 'react-icons/hi'
import Card from '../components/common/Card'
import TableIdentityCell from '../components/common/TableIdentityCell'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import GroupSlider from '../components/groups/GroupSlider'
import SubcategorySlider from '../components/groups/SubcategorySlider'
import PageHeader from '../components/common/PageHeader'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'

export default function GroupsPage() {
  const {
    groups,
    products,
    addGroup,
    updateGroup,
    deleteGroup,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useStore()
  const { showToast } = useToast()
  const { loading: deleting, run: runDelete } = useAsyncAction()
  const [search, setSearch] = useState('')
  const [showCategorySlider, setShowCategorySlider] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [subcategoryParent, setSubcategoryParent] = useState(null)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [showSubcategorySlider, setShowSubcategorySlider] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteSubConfirm, setDeleteSubConfirm] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups.filter((g) => {
      if (g.name.toLowerCase().includes(q)) return true
      return (g.subcategories || []).some((s) => s.name.toLowerCase().includes(q))
    })
  }, [groups, search])

  const productCountForGroup = (groupId) =>
    products.filter((p) => p.groupId === groupId).length

  const productCountForSubcategory = (groupId, subcategoryId) =>
    products.filter((p) => p.groupId === groupId && p.subcategoryId === subcategoryId).length

  const openAddCategory = () => {
    setEditingCategory(null)
    setShowCategorySlider(true)
  }

  const openEditCategory = (category) => {
    setEditingCategory(category)
    setShowCategorySlider(true)
  }

  const closeCategorySlider = () => {
    setShowCategorySlider(false)
    setEditingCategory(null)
  }

  const openAddSubcategory = (group) => {
    setSubcategoryParent(group)
    setEditingSubcategory(null)
    setShowSubcategorySlider(true)
  }

  const openEditSubcategory = (group, subcategory) => {
    setSubcategoryParent(group)
    setEditingSubcategory(subcategory)
    setShowSubcategorySlider(true)
  }

  const closeSubcategorySlider = () => {
    setShowSubcategorySlider(false)
    setSubcategoryParent(null)
    setEditingSubcategory(null)
  }

  const handleCategorySubmit = (name, category) => {
    if (category) {
      const ok = updateGroup(category.id, name)
      if (!ok) return null
      closeCategorySlider()
      showToast(`Category "${name}" updated`)
      return category.id
    }
    const id = addGroup(name)
    if (!id) return null
    closeCategorySlider()
    showToast(`Category "${name}" created`)
    return id
  }

  const handleSubcategorySubmit = (groupId, name, subcategory) => {
    if (subcategory) {
      const ok = updateSubcategory(groupId, subcategory.id, name)
      if (!ok) return null
      closeSubcategorySlider()
      showToast(`Subcategory "${name}" updated`)
      return subcategory.id
    }
    const id = addSubcategory(groupId, name)
    if (!id) return null
    closeSubcategorySlider()
    showToast(`Subcategory "${name}" added`)
    return id
  }

  const confirmDeleteCategory = () => {
    if (!deleteConfirm) return
    runDelete(async () => {
      await delay(300)
      deleteGroup(deleteConfirm.id)
      showToast(`Category "${deleteConfirm.name}" deleted`, 'info')
      setDeleteConfirm(null)
    })
  }

  const confirmDeleteSubcategory = () => {
    if (!deleteSubConfirm) return
    runDelete(async () => {
      await delay(300)
      deleteSubcategory(deleteSubConfirm.groupId, deleteSubConfirm.subcategory.id)
      showToast(`Subcategory "${deleteSubConfirm.subcategory.name}" deleted`, 'info')
      setDeleteSubConfirm(null)
    })
  }

  useEffect(() => {
    if (!deleteConfirm && !deleteSubConfirm) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setDeleteConfirm(null)
        setDeleteSubConfirm(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [deleteConfirm, deleteSubConfirm])

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        icon={HiOutlineCollection}
        iconClassName="from-violet-500 to-purple-600 shadow-violet-600/25"
        title="Categories"
        description="Organize products with categories and subcategories (e.g. Daily products → Milk, Breads)."
      >
        <Button onClick={openAddCategory} className="flex items-center gap-2">
          <HiOutlinePlusCircle className="w-5 h-5" />
          Add category
        </Button>
      </PageHeader>

      <GroupSlider
        open={showCategorySlider}
        category={editingCategory}
        onSubmit={handleCategorySubmit}
        onCancel={closeCategorySlider}
      />

      <SubcategorySlider
        open={showSubcategorySlider}
        parentGroup={subcategoryParent}
        subcategory={editingSubcategory}
        groups={groups}
        onSubmit={handleSubcategorySubmit}
        onCancel={closeSubcategorySlider}
      />

      <Card className="p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Search categories</h2>
          <Input
            type="search"
            icon={HiOutlineSearch}
            placeholder="Search category or subcategory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-md border-2 border-dashed border-violet-200 py-16 px-4 text-center bg-violet-50/30">
            <div className="inline-flex w-14 h-14 rounded-md bg-violet-50 items-center justify-center mb-3">
              <HiOutlineCollection className="w-7 h-7 text-violet-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium">
              {groups.length === 0 ? 'No categories yet. Add your first category.' : 'No categories match your search.'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border-2 border-violet-100 overflow-x-auto shadow-sm">
            <table className="w-full text-left min-w-[640px]">
              <thead className="bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-700 text-xs font-bold uppercase tracking-wider border-b border-violet-200">
                <tr>
                  <th className="px-4 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Products</th>
                  <th className="px-4 py-3.5 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((g, i) => {
                  const subs = g.subcategories || []
                  const badgeColor =
                    ['bg-sky-100 text-sky-700 border-sky-200', 'bg-amber-100 text-amber-700 border-amber-200', 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200'][i % 3]
                  return (
                    <Fragment key={g.id}>
                      <tr key={g.id} className="hover:bg-violet-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <TableIdentityCell title={g.name} subtitle="Category" name={g.name} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeColor}`}>
                            {productCountForGroup(g.id)} product{productCountForGroup(g.id) !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            className="!p-2 !rounded-md"
                            onClick={() => openAddSubcategory(g)}
                            title="Add subcategory"
                          >
                            <HiOutlinePlusCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="!p-2 !rounded-md"
                            onClick={() => openEditCategory(g)}
                            title="Edit category"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="!p-2 !rounded-md text-red-400 hover:text-red-600"
                            onClick={() => setDeleteConfirm(g)}
                            disabled={groups.length <= 1}
                            title={groups.length <= 1 ? 'At least one category is required' : 'Delete category'}
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                      {subs.map((sub) => (
                        <tr key={sub.id} className="bg-slate-50/60 hover:bg-teal-50/40 transition-colors">
                          <td className="px-4 py-3 pl-10">
                            <p className="text-sm font-semibold text-slate-800">{sub.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Subcategory · {g.name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border bg-teal-50 text-teal-700 border-teal-200">
                              {productCountForSubcategory(g.id, sub.id)} product{productCountForSubcategory(g.id, sub.id) !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <Button
                              variant="ghost"
                              className="!p-2 !rounded-md"
                              onClick={() => openEditSubcategory(g, sub)}
                              title="Edit subcategory"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              className="!p-2 !rounded-md text-red-400 hover:text-red-600"
                              onClick={() => setDeleteSubConfirm({ groupId: g.id, subcategory: sub })}
                              title="Delete subcategory"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete category?</h3>
            <p className="text-slate-500 text-sm mb-5 leading-relaxed">
              &quot;{deleteConfirm.name}&quot; and its subcategories will be removed. Products in this category will be uncategorized.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" onClick={confirmDeleteCategory} loading={deleting}>Delete</Button>
            </div>
          </Card>
        </div>
      )}

      {deleteSubConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete subcategory?</h3>
            <p className="text-slate-500 text-sm mb-5 leading-relaxed">
              &quot;{deleteSubConfirm.subcategory.name}&quot; will be removed. Products using it will keep the parent category only.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteSubConfirm(null)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" onClick={confirmDeleteSubcategory} loading={deleting}>Delete</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
