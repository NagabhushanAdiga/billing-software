import { useEffect, useState } from 'react'
import { HiOutlineUserGroup, HiOutlineTrash, HiOutlinePlusCircle, HiOutlineKey, HiOutlineX } from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import PageHeader from '../components/common/PageHeader'
import FormActions from '../components/common/FormActions'
import TableIdentityCell from '../components/common/TableIdentityCell'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'

const ROLE_BADGE = {
  cashier: 'bg-sky-100 text-sky-700 border-sky-200',
  manager: 'bg-amber-100 text-amber-700 border-amber-200',
}

const iconBtnClass =
  'flex items-center justify-center w-9 h-9 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

function ResetPasswordDialog({ member, open, onClose, onSubmit, loading }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!open) return
    setNewPassword('')
    setConfirmPassword('')
  }, [open, member?.id])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open || !member) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ newPassword, confirmPassword })
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-title"
      onClick={onClose}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card className="shadow-2xl" showAccent={false}>
          <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-slate-100">
            <div className="min-w-0">
              <h3 id="reset-password-title" className="text-lg font-bold text-slate-900">
                Reset password
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Set a new password for <strong className="text-slate-700">{member.name}</strong>
              </p>
              <p className="text-slate-400 text-xs font-mono mt-0.5">@{member.username}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`${iconBtnClass} text-slate-500 hover:text-slate-800 hover:bg-slate-100 shrink-0`}
              aria-label="Close"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <Input
              label="New password"
              type="password"
              hint="At least 4 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <FormActions
              onCancel={onClose}
              primaryLabel="Update password"
              primaryType="submit"
              loading={loading}
              disabled={loading}
            />
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function TeamPage() {
  const { user, teamMembers, addUser, deleteUser, resetUserPassword } = useAuth()
  const { showToast } = useToast()
  const { loading: adding, run: runAdd } = useAsyncAction()
  const { loading: deleting, run: runDelete } = useAsyncAction()
  const { loading: resetting, run: runReset } = useAsyncAction()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('cashier')
  const [resetMember, setResetMember] = useState(null)

  const handleAdd = (e) => {
    e.preventDefault()
    runAdd(async () => {
      await delay(250)
      const result = addUser({ name, username, password, role })
      if (!result.ok) {
        showToast(result.error, 'error')
        return
      }
      setName('')
      setUsername('')
      setPassword('')
      setRole('cashier')
      showToast(`${role === 'cashier' ? 'Cashier' : 'Manager'} added successfully`)
    })
  }

  const handleDelete = (member) => {
    if (!window.confirm(`Remove ${member.name} (${member.username})?`)) return
    runDelete(async () => {
      await delay(200)
      const result = deleteUser(member.id, user?.id)
      if (!result.ok) {
        showToast(result.error, 'error')
        return
      }
      showToast('User removed', 'info')
    })
  }

  const handleResetPassword = ({ newPassword, confirmPassword }) => {
    if (!resetMember) return
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    runReset(async () => {
      await delay(250)
      const result = resetUserPassword({ userId: resetMember.id, newPassword })
      if (!result.ok) {
        showToast(result.error || 'Could not reset password', 'error')
        return
      }
      showToast(`Password updated for ${resetMember.name}`)
      setResetMember(null)
    })
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-8">
      <PageHeader
        icon={HiOutlineUserGroup}
        iconClassName="from-indigo-500 to-violet-600 shadow-indigo-500/25"
        title="Team"
        description="Add cashiers and managers. Reset passwords or remove users from the list."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <HiOutlinePlusCircle className="w-5 h-5 text-violet-600" />
            Add team member
          </h2>
          <p className="text-slate-500 text-sm mb-5">Create a login for a cashier or manager.</p>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              required
            />
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. priya"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set a password"
              required
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="field-select"
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <Button type="submit" loading={adding} className="w-full sm:w-auto">
              Add {role === 'cashier' ? 'cashier' : 'manager'}
            </Button>
          </form>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Team members</h2>
          {teamMembers.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10 border-2 border-dashed border-slate-200 rounded-md">
              No cashiers or managers yet. Add someone using the form.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-md border border-slate-100 overflow-hidden">
              {teamMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 bg-white hover:bg-slate-50"
                >
                  <TableIdentityCell
                    title={member.name}
                    subtitle={`@${member.username}`}
                    name={member.name}
                    subtitleClassName="text-slate-400 text-xs mt-0.5 truncate font-mono"
                    className="flex-1 min-w-0"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-bold capitalize ${ROLE_BADGE[member.role] || ''}`}
                    >
                      {member.role}
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetMember(member)}
                      className={`${iconBtnClass} text-slate-500 hover:text-violet-700 hover:bg-violet-50`}
                      title="Reset password"
                      aria-label={`Reset password for ${member.name}`}
                    >
                      <HiOutlineKey className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(member)}
                      disabled={deleting}
                      className={`${iconBtnClass} text-red-400 hover:text-red-600 hover:bg-red-50`}
                      title="Remove user"
                      aria-label={`Remove ${member.name}`}
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ResetPasswordDialog
        member={resetMember}
        open={!!resetMember}
        onClose={() => setResetMember(null)}
        onSubmit={handleResetPassword}
        loading={resetting}
      />
    </div>
  )
}
