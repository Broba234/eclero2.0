'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { UploadFileDialog } from '@/components/UploadFileDialog'
import { ScreenShareButton } from '@/components/ScreenShareButton'
import { EndSessionButton } from '@/components/EndSessionButton'
import { useSession } from '@/hooks/useSession'

export function SessionSidebar() {
  const { hasSharedFile, isScreenSharing, videoFeed } = useSession()
  const [fileDialogOpen, setFileDialogOpen] = useState(false)

  return (
    <aside className="w-[280px] bg-gray-50 rounded-xl p-4 shadow-md flex flex-col gap-4 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-full overflow-hidden w-12 h-12 bg-gray-200 border">
          {/* VIDEO PiP STYLE */}
          {videoFeed}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">You</p>
          <p className="text-xs text-gray-400">Live</p>
        </div>
      </div>

      <Separator />

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <ScreenShareButton />

        <Button
          variant="outline"
          className="justify-start"
          onClick={() => setFileDialogOpen(true)}
        >
          {hasSharedFile ? 'View File' : 'Share File'}
        </Button>

        {!isScreenSharing && (
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => {
              const el = document.querySelector('#whiteboard') as HTMLElement
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Whiteboard Tools
          </Button>
        )}

        <EndSessionButton />
      </div>

      <UploadFileDialog open={fileDialogOpen} onOpenChange={setFileDialogOpen} />
    </aside>
  )
}
