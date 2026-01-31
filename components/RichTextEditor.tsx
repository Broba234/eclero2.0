'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { useEffect, useState } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Pilcrow
} from 'lucide-react'

// Toolbar Component
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="border-b p-2 flex flex-wrap gap-1 bg-white">
      {/* Text Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-100 text-black' : 'text-gray-600'}`}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-100 text-black' : 'text-gray-600'}`}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-gray-100 text-black' : 'text-gray-600'}`}
        title="Underline"
      >
        <UnderlineIcon size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-100 text-black' : 'text-gray-600'}`}
        title="Heading 1"
      >
        <Heading1 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-100 text-black' : 'text-gray-600'}`}
        title="Heading 2"
      >
        <Heading2 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-100 text-black' : 'text-gray-600'}`}
        title="Heading 3"
      >
        <Heading3 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('paragraph') ? 'bg-gray-100 text-black' : 'text-gray-600'}`}
        title="Paragraph"
      >
        <Pilcrow size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-gray-100 text-black' : 'text-gray-600'}`}
        title="Bullet List"
      >
        <List size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-gray-100 text-black' : 'text-gray-600'}`}
        title="Numbered List"
      >
        <ListOrdered size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Blockquote */}
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('blockquote') ? 'bg-gray-100 text-black' : 'text-gray-600'}`}
        title="Quote"
      >
        <Quote size={18} />
      </button>

      {/* Link */}
      <button
        onClick={setLink}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('link') ? 'bg-gray-100 text-black' : 'text-gray-600'}`}
        title="Link"
      >
        <LinkIcon size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* History */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        className="p-2 rounded hover:bg-gray-100 text-gray-600"
        title="Undo"
      >
        <Undo size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        className="p-2 rounded hover:bg-gray-100 text-gray-600"
        title="Redo"
      >
        <Redo size={18} />
      </button>
    </div>
  )
}

interface TiptapEditorProps {
  onChange: (html: string) => void | undefined
  value?: string
}

export default function TiptapEditor({ onChange, value = '' }: TiptapEditorProps) {
  const [mounted, setMounted] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none text-gray-800',
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="border-b p-2 h-12 bg-gray-50 animate-pulse" />
        <div className="p-4 min-h-[200px] bg-white animate-pulse" />
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}