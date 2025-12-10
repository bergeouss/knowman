'use client'

import { useState } from 'react'
import { BookOpen, Download, Settings, Upload, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { toast } from 'sonner'

const actions = [
  {
    title: 'Capture Webpage',
    description: 'Add a new webpage to your knowledge base',
    icon: BookOpen,
    action: () => {
      const url = prompt('Enter webpage URL to capture:')
      if (url) {
        // In a real implementation, this would call the capture API
        toast.info(`Capturing webpage: ${url}`)
        // For now, just show a message
        setTimeout(() => {
          toast.success('Webpage captured successfully! Processing started.')
        }, 1000)
      }
    },
    color: 'bg-blue-500',
  },
  {
    title: 'Import Documents',
    description: 'Upload PDFs, markdown, or text files',
    icon: Upload,
    action: () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.pdf,.md,.txt,.doc,.docx'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          toast.info(`Uploading file: ${file.name}`)
          // In a real implementation, this would upload the file
          setTimeout(() => {
            toast.success('File uploaded successfully! Processing started.')
          }, 1000)
        }
      }
      input.click()
    },
    color: 'bg-green-500',
  },
  {
    title: 'Export Data',
    description: 'Export your knowledge base as JSON or markdown',
    icon: Download,
    action: () => {
      toast.info('Preparing data export...')
      // In a real implementation, this would trigger a download
      setTimeout(() => {
        toast.success('Data exported successfully!')
      }, 1500)
    },
    color: 'bg-purple-500',
  },
  {
    title: 'AI Processing',
    description: 'Run AI summarization on pending items',
    icon: Zap,
    action: () => {
      toast.info('Starting AI processing on pending items...')
      // In a real implementation, this would trigger processing
      setTimeout(() => {
        toast.success('AI processing completed!')
      }, 2000)
    },
    color: 'bg-yellow-500',
  },
  {
    title: 'Settings',
    description: 'Configure extension and processing settings',
    icon: Settings,
    action: () => {
      window.location.href = '/settings'
    },
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