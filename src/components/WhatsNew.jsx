import { Sparkles, Award, ListChecks, Shield, Code2, Package } from 'lucide-react'
import packageJson from '../../package.json'

export default function WhatsNew() {
  const version = packageJson.version

  const changelog = [
    {
      version: '2.1.0',
      date: 'December 2024',
      changes: [
        {
          icon: Award,
          color: 'text-yellow-600 bg-yellow-50',
          title: 'School Merit System',
          description: 'Kids can now log merits they receive at school! Parents can set up merit types (like "Gold Star", "Excellence Award") with custom point values and icons. Kids can quickly log their merits in Kid View, and parents can see the full history and award merits manually too.'
        },
        {
          icon: ListChecks,
          color: 'text-blue-600 bg-blue-50',
          title: 'Kid-Created Tasks',
          description: 'Kids can now create their own tasks! When they want to do something extra (like "organize the garage"), they can add it themselves. Parents review and assign point values, giving kids more ownership over their contributions.'
        },
        {
          icon: Sparkles,
          color: 'text-purple-600 bg-purple-50',
          title: 'Version Display',
          description: 'Version number now shown in the header so you always know which version you\'re running. Especially useful when running multiple instances (dev vs production).'
        }
      ]
    },
    {
      version: '2.0.0',
      date: 'December 2024',
      changes: [
        {
          icon: Shield,
          color: 'text-red-600 bg-red-50',
          title: 'Error Boundaries',
          description: 'Each section now has independent error handling. If one feature breaks, the rest of the app keeps working! No more complete app crashes from a single error.'
        },
        {
          icon: Code2,
          color: 'text-green-600 bg-green-50',
          title: 'Modular Code Structure',
          description: 'Complete code restructure! All components moved to separate files making the codebase much easier to maintain and update. Reduced main App.jsx from 1843 lines to 746 lines.'
        },
        {
          icon: Package,
          color: 'text-indigo-600 bg-indigo-50',
          title: 'Task Return Feature',
          description: 'Kids can now return tasks to the pool with a reason. When a child clicks the X button on a task, they must provide a reason why they can\'t complete it. Parents can see these reasons and reassign tasks accordingly.'
        }
      ]
    }
  ]

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="text-purple-600" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">What's New</h2>
          <p className="text-sm text-gray-500">Current Version: v{version}</p>
        </div>
      </div>

      <div className="space-y-8">
        {changelog.map((release) => (
          <div key={release.version} className="border-l-4 border-purple-300 pl-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Version {release.version}
              </h3>
              <p className="text-sm text-gray-500">{release.date}</p>
            </div>

            <div className="space-y-4">
              {release.changes.map((change, idx) => {
                const Icon = change.icon
                return (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${change.color} flex items-center justify-center`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 mb-2">{change.title}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{change.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
        <h4 className="font-bold text-gray-800 mb-2">Coming Soon</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Recurring task automation</li>
          <li>• Mobile app notifications</li>
          <li>• Weekly/monthly reports</li>
          <li>• Custom themes and colors</li>
        </ul>
      </div>
    </div>
  )
}
