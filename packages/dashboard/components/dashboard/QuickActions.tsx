import { BookOpen, Download, Settings, Upload, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

const actions = [
  {
    title: 'Capture Webpage',
    description: 'Add a new webpage to your knowledge base',
    icon: BookOpen,
    action: () => console.log('Capture webpage'),
    color: 'bg-blue-500',
  },
  {
    title: 'Import Documents',
    description: 'Upload PDFs, markdown, or text files',
    icon: Upload,
    action: () => console.log('Import documents'),
    color: 'bg-green-500',
  },
  {
    title: 'Export Data',
    description: 'Export your knowledge base as JSON or markdown',
    icon: Download,
    action: () => console.log('Export data'),
    color: 'bg-purple-500',
  },
  {
    title: 'AI Processing',
    description: 'Run AI summarization on pending items',
    icon: Zap,
    action: () => console.log('AI processing'),
    color: 'bg-yellow-500',
  },
  {
    title: 'Settings',
    description: 'Configure extension and processing settings',
    icon: Settings,
    action: () => console.log('Settings'),
    color: 'bg-gray-500',
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to manage your knowledge base</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.title}
                onClick={action.action}
                className="flex items-center justify-between rounded-lg border p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900/50"
              >
                <div className="flex items-center space-x-4">
                  <div className={`rounded-lg p-2 ${action.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{action.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </div>
                <div className="text-gray-400">
                  <span className="sr-only">Perform action</span>
                  →
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}