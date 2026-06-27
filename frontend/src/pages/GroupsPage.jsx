import { useMemo, useState, useEffect } from 'react'
import { HiOutlineCollection, HiOutlinePlusCircle, HiOutlineSearch, HiOutlineTrash } from 'react-icons/hi'
import Card from '../components/common/Card'
import TableIdentityCell from '../components/common/TableIdentityCell'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import GroupSlider from '../components/groups/GroupSlider'
import PageHeader from '../components/common/PageHeader'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'

export default function GroupsPage() {
  const { groups, products, addGroup, deleteGroup } = useStore()
  const { showToast } = useToast()
  const { loading: deleting, run: runDelete } = useAsyncAction()
  const [search, setSearch] = useState('')
  const [showAddSlider, setShowAddSlider] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups.filter((g) => g.name.toLowerCase().includes(q))
  }, [groups, search])

  const productCountFor = (groupId) => products.filter((p) => p.groupId === groupId).length

  const handleAdd = (name) => {
    const id = addGroup(name)
    if (!id) return null
    setShowAddSlider(false)
    showToast(`Category "${name}" created`)
    return id
  }

  const confirmDelete = () => {
    if (!deleteConfirm) return
    runDelete(async () => {
      await delay(300)
      deleteGroup(deleteConfirm.id)
      showToast(`Category "${deleteConfirm.name}" deleted`, 'info')
      setDeleteConfirm(null)
    })
  }

  useEffect(() => {
    if (!deleteConfirm) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') setDeleteConfirm(null)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [deleteConfirm])

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        icon={HiOutlineCollection}
        iconClassName="from-violet-500 to-purple-600 shadow-violet-600/25"
        title="Categories"
        description="Create categories to organize products — assigning a category when adding products is optional."
      >
        <Button onClick={() => setShowAddSlider(true)} className="flex items-center gap-2">
          <HiOutlinePlusCircle className="w-5 h-5" />
          Add category
        </Button>
      </PageHeader>

      <GroupSlider
        open={showAddSlider}
        onSubmit={handleAdd}
        onCancel={() => setShowAddSlider(false)}
      />

      <Card className="p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Search categories</h2>
          <Input
            type="search"
            icon={HiOutlineSearch}
            placeholder="Search by category name..."
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
            <table className="w-full text-left min-w-[480px]">
              <thead className="bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-700 text-xs font-bold uppercase tracking-wider border-b border-violet-200">
                <tr>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Products</th>
                  <th className="px-4 py-3.5 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((g, i) => (
                  <tr key={g.id} className="hover:bg-violet-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <TableIdentityCell title={g.name} subtitle={g.id} name={g.name} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        ['bg-sky-100 text-sky-700 border-sky-200', 'bg-amber-100 text-amber-700 border-amber-200', 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200'][i % 3]
                      }`}>
                        {productCountFor(g.id)} product{productCountFor(g.id) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
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
                ))}
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
              &quot;{deleteConfirm.name}&quot; will be removed. Products in this category will be moved to another category.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete} loading={deleting}>Delete</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
