import { Star, Eye, EyeOff, LogOut } from 'lucide-react'
import packageJson from '../../package.json'

function Header({ viewMode, setViewMode, onLogout, isPasswordProtected }) {
  const version = packageJson.version
  const buildDate = import.meta.env.VITE_BUILD_DATE || 'dev'

  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="w-32 flex gap-2">
          {viewMode === 'parent' && isPasswordProtected && onLogout && (
            <button
              onClick={onLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all"
              title="Logout from Parent View"
            >
              <LogOut size={20} />
              Logout
            </button>
          )}
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-5xl font-bold text-white flex items-center gap-3">
            <Star className="text-yellow-300" size={48} />
            Family Task Tracker
            <Star className="text-yellow-300" size={48} />
          </h1>
          <p className="text-white/50 text-xs mt-1" title={`Build: ${buildDate}`}>
            v{version}
          </p>
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'parent' ? 'kid' : 'parent')}
          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all"
        >
          {viewMode === 'parent' ? <Eye size={20} /> : <EyeOff size={20} />}
          {viewMode === 'parent' ? 'Kid View' : 'Parent View'}
        </button>
      </div>
      <p className="text-white/90 text-lg">
        {viewMode === 'parent' ? 'Manage tasks, track progress, award points!' : 'Complete tasks, earn rewards!'}
      </p>
    </div>
  )
}

export default Header
