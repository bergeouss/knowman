import { Clock, ExternalLink, FileText, Globe, Video } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const recentItems = [
  {
    id: '1',
    title: 'Understanding React Server Components',
    type: 'webpage',
    url: 'https://react.dev/blog',
    date: '2 hours ago',
    tags: ['react', 'frontend', 'server-components'],
    status: 'processed',
  },
  {
    id: '2',
    title: 'TypeScript Advanced Types Workshop',
    type: 'document',
    url: '/documents/typescript.pdf',
    date: '5 hours ago',
    tags: ['typescript', 'workshop', 'advanced'],
    status: 'processing',
  },
  {
    id: '3',
    title: 'AI Ethics in Modern Applications',
    type: 'webpage',
    url: 'https://ai-ethics.org',
    date: '1 day ago',
    tags: ['ai', 'ethics', 'philosophy'],
    status: 'processed',
  },
  {
    id: '4',
    title: 'Building Scalable Microservices',
    type: 'video',
    url: 'https://youtube.com/watch?v=abc123',
    date: '2 days ago',
    tags: ['microservices', 'architecture', 'scalability'],
    status: 'processed',
  },
  {
    id: '5',
    title: 'Introduction to Quantum Computing',
    type: 'document',
    url: '/documents/quantum.pdf',
    date: '3 days ago',
    tags: ['quantum', 'physics', 'computing'],
    status: 'archived',
  },
]

const typeIcons = {
  webpage: Globe,
  document: FileText,
  video: Video,
}

const statusColors = {
  processed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
}

export function RecentItems() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Items</CardTitle>
            <CardDescription>Recently captured knowledge items</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentItems.map((item) => {
            const Icon = typeIcons[item.type as keyof typeof typeIcons] || FileText
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50"
              >
                <div className="flex items-start space-x-4">
                  <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium">{item.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {item.date}
                      </span>
                      <span className="truncate">{item.url}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                      <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}