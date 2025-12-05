import { BookOpen, FileText, Search, TrendingUp, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { RecentItems } from '@/components/dashboard/RecentItems'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { QuickActions } from '@/components/dashboard/QuickActions'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Vincent</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here&apos;s what&apos;s happening with your knowledge base today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Quick Search
          </Button>
          <Button>
            <BookOpen className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid />

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Items */}
        <div className="lg:col-span-2">
          <RecentItems />
        </div>

        {/* Quick Actions & Sidebar */}
        <div className="space-y-6">
          <QuickActions />

          {/* Processing Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Processing Queue
              </CardTitle>
              <CardDescription>AI processing jobs in progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Summarization</p>
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                      <div className="h-full w-3/4 rounded-full bg-green-500" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">3/4</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Tagging</p>
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                      <div className="h-full w-1/2 rounded-full bg-blue-500" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">2/4</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Embedding</p>
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                      <div className="h-full w-1/4 rounded-full bg-purple-500" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">1/4</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-600" />
                Pro Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use the browser extension to quickly capture articles while browsing.
                Highlight text before clicking the extension icon for more accurate
                content extraction.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}