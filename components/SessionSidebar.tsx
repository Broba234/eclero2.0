'use client'

import { useState } from 'react'
import Button from '@/components/ui/components/ui/button/Button'

export function SessionSidebar() {
  const [fileDialogOpen, setFileDialogOpen] = useState(false)

  return (
    <aside className="w-[280px] bg-gray-50 rounded-xl p-4 shadow-md flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-full overflow-hidden w-12 h-12 bg-gray-200 border">
          {/* Placeholder for video feed */}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">You</p>
          <p className="text-xs text-gray-400">Live</p>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-gray-200"></div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <Button
          className="justify-start"
          onClick={() => console.log('Screen share clicked')}
        >
          Share Screen
        </Button>

        <Button
          className="justify-start"
          onClick={() => setFileDialogOpen(true)}
        >
          Share File
        </Button>

        <Button
          className="justify-start"
          onClick={() => {
            const el = document.querySelector('#whiteboard') as HTMLElement
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          Whiteboard Tools
        </Button>

        <Button
          variant="outline"
          className="justify-start border-red-300 text-red-600 hover:bg-red-50"
          onClick={() => console.log('End session clicked')}
        >
          End Session
        </Button>
      </div>

      {/* TODO: Add file dialog when component is created */}
      {fileDialogOpen && (
        <div className="text-sm text-gray-500">File dialog would open here</div>
      )}
    </aside>
  )
}
