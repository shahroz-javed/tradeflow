import { useMemo } from 'react'

// Bundled at build time (not served as static files) so notes stay private
// behind the app's auth instead of sitting at a guessable public/ URL.
const rawModules = import.meta.glob('/src/forex/**/*', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const ROOT_LABEL = 'Forex Notes'

function extOf(name) {
  const idx = name.lastIndexOf('.')
  if (idx === -1 || idx === 0) return ''
  return name.slice(idx + 1).toLowerCase()
}

function buildTree() {
  const root = { name: ROOT_LABEL, path: '', type: 'folder', children: [] }
  const folders = new Map([['', root]])

  const paths = Object.keys(rawModules)
    .map((p) => p.replace(/^\/src\/forex\//, ''))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

  for (const relPath of paths) {
    const parts = relPath.split('/')
    let parentPath = ''

    for (let i = 0; i < parts.length - 1; i++) {
      const folderPath = parentPath ? `${parentPath}/${parts[i]}` : parts[i]
      if (!folders.has(folderPath)) {
        const folder = { name: parts[i], path: folderPath, type: 'folder', children: [] }
        folders.get(parentPath).children.push(folder)
        folders.set(folderPath, folder)
      }
      parentPath = folderPath
    }

    const fileName = parts[parts.length - 1]
    const fullSourcePath = `/src/forex/${relPath}`
    folders.get(parentPath).children.push({
      name: fileName,
      path: relPath,
      type: 'file',
      ext: extOf(fileName),
      content: rawModules[fullSourcePath],
      size: rawModules[fullSourcePath].length,
    })
  }

  const sortChildren = (node) => {
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    })
    node.children.forEach((child) => {
      if (child.type === 'folder') sortChildren(child)
    })
  }
  sortChildren(root)

  return root
}

function flattenFiles(node, result = []) {
  if (node.type === 'file') {
    result.push(node)
  } else {
    node.children.forEach((child) => flattenFiles(child, result))
  }
  return result
}

export function useDocs() {
  return useMemo(() => {
    const tree = buildTree()
    const files = flattenFiles(tree)
    return { tree, files, fileCount: files.length }
  }, [])
}
