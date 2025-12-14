import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function PasswordLogin({ onLogin, onCancel }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await onLogin(password)
      if (!result.success) {
        setError(result.error || 'Incorrect password')
      }
    } catch (err) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Parent Access</h2>
          <p className="text-gray-600">Enter password to access Parent View</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!password || loading}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Checking...' : 'Login'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Kids can still access Kid View without password</p>
        </div>
      </div>
    </div>
  )
}
