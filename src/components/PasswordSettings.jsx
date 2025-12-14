import { useState } from 'react'
import { Lock, Eye, EyeOff, Check, X, AlertCircle, Shield } from 'lucide-react'
import {
  isPasswordSet,
  setupPassword,
  changePassword,
  removePassword,
  getPasswordStrength
} from '../utils/authManager'

export default function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const passwordExists = isPasswordSet()
  const passwordStrength = getPasswordStrength(newPassword)

  const handleSetupPassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Password must be at least 4 characters' })
      return
    }

    const result = await setupPassword(newPassword)
    if (result.success) {
      setMessage({ type: 'success', text: 'Password set successfully!' })
      setNewPassword('')
      setConfirmPassword('')
      setIsEditing(false)
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    const result = await changePassword(currentPassword, newPassword)
    if (result.success) {
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsEditing(false)
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  const handleRemovePassword = async () => {
    if (!confirm('Remove password protection? Anyone will be able to access Parent View!')) {
      return
    }

    const result = await removePassword(currentPassword)
    if (result.success) {
      setMessage({ type: 'success', text: 'Password protection removed' })
      setCurrentPassword('')
      setIsEditing(false)
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  return (
    <div className="mt-8 bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Shield size={24} />
            Password Protection
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {passwordExists
              ? 'Password is currently set - Parent View is protected'
              : 'No password set - Anyone can access Parent View'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {passwordExists && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <Lock size={14} />
              Protected
            </span>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-100 border border-green-300 text-green-800'
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}
        >
          {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

      {!isEditing ? (
        <div className="flex gap-3">
          {!passwordExists ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
            >
              <Lock size={20} />
              Set Up Password
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700"
              >
                Change Password
              </button>
              <button
                onClick={handleRemovePassword}
                className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600"
              >
                Remove Password
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {passwordExists && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-12 rounded-lg border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {passwordExists ? 'New Password' : 'Password'}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter new password"
            />
            {newPassword && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      passwordStrength.color === 'red'
                        ? 'bg-red-500'
                        : passwordStrength.color === 'orange'
                        ? 'bg-orange-500'
                        : passwordStrength.color === 'yellow'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-600">{passwordStrength.text}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Confirm new password"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-sm text-red-600 font-semibold">Passwords do not match</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={passwordExists ? handleChangePassword : handleSetupPassword}
              disabled={!newPassword || newPassword !== confirmPassword || (passwordExists && !currentPassword)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {passwordExists ? 'Change Password' : 'Set Password'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
                setMessage(null)
              }}
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 bg-white rounded-lg p-4 border border-purple-200">
        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <AlertCircle size={16} />
          How Password Protection Works
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Password protects access to Parent View only</li>
          <li>• Kids can still access Kid View without password</li>
          <li>• Session lasts 24 hours before requiring re-login</li>
          <li>• Password is stored securely (hashed with SHA-256)</li>
          <li>• Minimum 4 characters, longer is better!</li>
          <li>• Use the Logout button to end your session early</li>
        </ul>
      </div>
    </div>
  )
}
