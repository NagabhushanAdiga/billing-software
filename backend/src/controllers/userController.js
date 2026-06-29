import { UserModel } from '../models/UserModel.js'
import { AuditModel } from '../models/AuditModel.js'
import { toPublicUser } from '../utils/helpers.js'
import { ok, fail } from '../utils/response.js'

const TEAM_ROLES = ['cashier', 'manager', 'admin']

export const UserController = {
  list(req, res) {
    return ok(res, { teamMembers: UserModel.findTeamMembers() })
  },

  create(req, res) {
    const { name, username, password, role } = req.body || {}
    const trimmedName = String(name || '').trim()
    const trimmedUsername = String(username || '').trim().toLowerCase()
    const trimmedPassword = String(password || '')

    if (!trimmedName || !trimmedUsername || !trimmedPassword) {
      return fail(res, 'All fields are required')
    }

    if (!TEAM_ROLES.includes(role)) {
      return fail(res, 'Role must be cashier, manager, or admin')
    }

    if (UserModel.findByUsername(trimmedUsername)) {
      return fail(res, 'Username already exists')
    }

    if (role === 'admin') {
      const adminPassword = String(req.body?.adminPassword || '').trim()
      if (!adminPassword) {
        return fail(res, 'Your password is required to add an admin')
      }
      const actor = UserModel.findById(req.user.id)
      if (!actor || !UserModel.verifyPassword(actor, adminPassword)) {
        return fail(res, 'Incorrect password')
      }
    }

    const created = UserModel.create({
      name: trimmedName,
      username: trimmedUsername,
      password: trimmedPassword,
      role,
    })

    AuditModel.create({
      action: 'user_added',
      category: 'team',
      details: `${trimmedName} (@${trimmedUsername}) · ${role}`,
      actor: req.user,
    })

    return ok(res, { id: created.id, user: toPublicUser(created) }, 201)
  },

  remove(req, res) {
    const { id } = req.params
    const target = UserModel.findById(id)
    if (!target) return fail(res, 'User not found', 404)
    if (id === req.user.id) return fail(res, 'Cannot delete your own account')

    UserModel.delete(id)
    AuditModel.create({
      action: 'user_deleted',
      category: 'team',
      details: `${target.name} (@${target.username})`,
      actor: req.user,
    })
    return ok(res, { message: 'User removed' })
  },

  resetPassword(req, res) {
    const { id } = req.params
    const { newPassword } = req.body || {}
    const trimmedNew = String(newPassword || '').trim()

    if (trimmedNew.length < 4) {
      return fail(res, 'Password must be at least 4 characters')
    }

    const target = UserModel.findById(id)
    if (!target) return fail(res, 'User not found', 404)

    UserModel.updatePassword(id, trimmedNew)
    AuditModel.create({
      action: 'password_reset',
      category: 'team',
      details: `Password reset for ${target.name} (@${target.username})`,
      actor: req.user,
    })
    return ok(res, { message: 'Password updated' })
  },
}
