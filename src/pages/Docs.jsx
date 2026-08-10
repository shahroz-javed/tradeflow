import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  File,
  FileCode,
  FileText,
  Folder,
  FolderOpen,
  LogOut,
  NotebookText,
  Search,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDocs } from '../hooks/useDocs'
import { useAuth } from '../hooks/useAuth'

const CODE_EXTS = new Set(['html', 'htm', 'js', 'jsx', 'ts', 'tsx', 'css', 'json', 'md'])

function fileIconFor(ext) {
  if (CODE_EXTS.has(ext)) return FileCode
  if (ext === 'txt' || ext === '') return FileText
  return File
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function TreeNode({ node, depth, activePath, onSelect, openFolders, toggleFolder }) {
  if (node.type === 'folder') {
    const isOpen = openFolders.has(node.path) || depth === 0
    const Icon = isOpen ? FolderOpen : Folder
    return (
      <div>
        <button
          type="button"
          onClick={() => toggleFolder(node.path)}
          style={{ paddingLeft: `${12 + depth * 14}px` }}
          className="flex w-full items-center gap-2 rounded-md py-1.5 pr-3 text-left text-sm text-text-dim transition-colors hover:bg-panel-2 hover:text-text"
        >
          <ChevronRight
            size={13}
            className={`shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
          <Icon size={15} className="shrink-0 text-accent" />
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {isOpen && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                activePath={activePath}
                onSelect={onSelect}
                openFolders={openFolders}
                toggleFolder={toggleFolder}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const Icon = fileIconFor(node.ext)
  const isActive = node.path === activePath

  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      style={{ paddingLeft: `${12 + depth * 14 + 19}px` }}
      title={node.name}
      className={`flex w-full items-center gap-2 rounded-md py-1.5 pr-3 text-left text-sm transition-colors ${
        isActive ? 'bg-accent/15 text-accent' : 'text-text-dim hover:bg-panel-2 hover:text-text'
      }`}
    >
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  )
}

function HtmlPreview({ node }) {
  const src = useMemo(
    () => `data:text/html;charset=utf-8,${encodeURIComponent(node.content)}`,
    [node]
  )
  return (
    <iframe
      title={node.name}
      src={src}
      sandbox="allow-scripts"
      className="h-full w-full border-0 bg-white"
    />
  )
}

function TextPreview({ node }) {
  return (
    <pre className="whitespace-pre-wrap break-words p-6 font-mono text-[13px] leading-relaxed text-text">
      {node.content}
    </pre>
  )
}

function DocPreview({ node }) {
  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-text-dim">
        <FileText size={48} className="opacity-30" />
        <p className="text-sm">Select a note to preview</p>
      </div>
    )
  }

  const isHtml = node.ext === 'html' || node.ext === 'htm'

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        {(() => {
          const Icon = fileIconFor(node.ext)
          return <Icon size={18} className="shrink-0 text-text-dim" />
        })()}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-text">{node.name}</div>
          <div className="text-xs text-text-dim">
            {(node.ext || 'file').toUpperCase()} · {formatSize(node.size)}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {isHtml ? <HtmlPreview node={node} /> : <TextPreview node={node} />}
      </div>
    </div>
  )
}

export default function Docs() {
  const { tree, files, fileCount } = useDocs()
  const [activePath, setActivePath] = useState(null)
  const [query, setQuery] = useState('')
  const [openFolders, setOpenFolders] = useState(() => new Set())
  const { logout } = useAuth()

  const activeNode = useMemo(
    () => files.find((f) => f.path === activePath) || null,
    [files, activePath]
  )

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return files.filter(
      (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
    )
  }, [files, query])

  function toggleFolder(path) {
    setOpenFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function select(node) {
    setActivePath(node.path)
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-panel px-4">
        <Link
          to="/"
          title="Back to TradeFlow"
          className="flex items-center gap-1.5 rounded-md border border-border bg-panel-2 px-2.5 py-1.5 text-xs font-medium text-text-dim transition-colors hover:text-text"
        >
          <ArrowLeft size={14} />
          Back to App
        </Link>
        <div className="flex items-center gap-2">
          <NotebookText size={18} className="text-accent" />
          <span className="text-base font-semibold text-text">Docs</span>
        </div>
        <span className="text-xs text-text-dim">{fileCount} notes</span>
        <div className="ml-auto">
          <button
            type="button"
            onClick={logout}
            title="Logout"
            className="rounded-md p-1.5 text-text-dim hover:bg-loss/15 hover:text-loss"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-panel">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes…"
                className="input-base py-1.5 pl-8 pr-7 text-xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-dim hover:text-text"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {searchResults ? (
              searchResults.length ? (
                searchResults.map((node) => (
                  <button
                    key={node.path}
                    type="button"
                    onClick={() => select(node)}
                    title={node.path}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                      node.path === activePath
                        ? 'bg-accent/15 text-accent'
                        : 'text-text-dim hover:bg-panel-2 hover:text-text'
                    }`}
                  >
                    {(() => {
                      const Icon = fileIconFor(node.ext)
                      return <Icon size={14} className="shrink-0" />
                    })()}
                    <span className="truncate">{node.name}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-text-dim">No notes match "{query}"</p>
              )
            ) : (
              <TreeNode
                node={tree}
                depth={0}
                activePath={activePath}
                onSelect={select}
                openFolders={openFolders}
                toggleFolder={toggleFolder}
              />
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">
          <DocPreview node={activeNode} />
        </main>
      </div>
    </div>
  )
}
