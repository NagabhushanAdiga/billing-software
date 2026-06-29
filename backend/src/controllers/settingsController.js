import { SettingsModel } from '../models/SettingsModel.js'
import { AuditModel } from '../models/AuditModel.js'
import { ok } from '../utils/response.js'

export const SettingsController = {
  get(req, res) {
    return ok(res, { settings: SettingsModel.get() })
  },

  update(req, res) {
    const settings = SettingsModel.update(req.body || {})
    AuditModel.create({
      action: 'settings_updated',
      category: 'settings',
      details: 'Store settings updated',
      actor: req.user,
    })
    return ok(res, { settings })
  },
}
