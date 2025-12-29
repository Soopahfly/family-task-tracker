import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'

export default function ReturnTaskDialog({ task, onReturn, onCancel }) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (reason.trim().length < 5) {
      alert('Please provide a reason (at least 5 characters)')
      return
    }

    setIsSubmitting(true)
    try {
      await onReturn(reason)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Return Task?</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            You're returning: <span className="font-bold">{task.title}</span>
          </p>
          <p className="text-sm text-gray-500">
            Please tell us why you can't complete this task. It will go back to the task pool for someone else.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for returning this task
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows="4"
              placeholder="Example: I don't have time today, I need help with this, This is too difficult for me..."
              required
              minLength={5}
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              {reason.length}/100 characters (minimum 5)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting || reason.trim().length < 5}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Returning...' : 'Return Task'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Only parents can permanently delete tasks. When you return a task, it goes back to the task pool.
          </p>
        </div>
      </div>
    </div>
  )
}
