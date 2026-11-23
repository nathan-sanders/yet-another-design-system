import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { docs as seedDocs, docThreads, type DocBlock, type ProjectDoc } from '../../data/docs'
import { me } from '../../data/people'
import { DocsContext, type DocsState } from './docsState'

let made = 0
const newId = (prefix: string) => `${prefix}-new-${++made}`

/** What any change of yours does to a doc besides the change itself. */
function touched(doc: ProjectDoc): ProjectDoc {
  const editorIds =
    doc.ownerId === me.id || doc.editorIds?.includes(me.id)
      ? doc.editorIds
      : [...(doc.editorIds ?? []), me.id]
  return { ...doc, edited: true, updated: 'Just now', editorIds }
}

/**
 * Docs, held above the router like the tasks and the requests, so a line
 * edited on a doc's page is still edited on the project's Docs tab, a task
 * created from a doc is linked to it, and a resolved thread stays resolved.
 */
export function DocsProvider({ children }: { children: ReactNode }) {
  const [docs, setDocs] = useState(seedDocs)
  const [threads, setThreads] = useState(docThreads)

  const change = useCallback((docId: string, update: (doc: ProjectDoc) => ProjectDoc) => {
    setDocs((all) => all.map((doc) => (doc.id === docId ? touched(update(doc)) : doc)))
  }, [])

  const updateBlock = useCallback(
    (docId: string, blockId: string, text: string) =>
      change(docId, (doc) => ({
        ...doc,
        blocks: doc.blocks?.map((b) => (b.id === blockId && 'text' in b ? { ...b, text } : b)),
      })),
    [change],
  )

  const renameDoc = useCallback(
    (docId: string, name: string) => change(docId, (doc) => ({ ...doc, name })),
    [change],
  )

  const insertBlock = useCallback(
    (docId: string, block: DocBlock, afterId?: string) =>
      change(docId, (doc) => {
        const blocks = [...(doc.blocks ?? [])]
        const at = afterId ? blocks.findIndex((b) => b.id === afterId) + 1 : blocks.length
        blocks.splice(at || blocks.length, 0, block)
        return { ...doc, blocks }
      }),
    [change],
  )

  const removeBlock = useCallback(
    (docId: string, blockId: string) =>
      change(docId, (doc) => ({ ...doc, blocks: doc.blocks?.filter((b) => b.id !== blockId) })),
    [change],
  )

  const editBlocks = useCallback(
    (docId: string, update: (blocks: DocBlock[]) => DocBlock[]) =>
      change(docId, (doc) => ({ ...doc, blocks: update(doc.blocks ?? []) })),
    [change],
  )

  const moveThreads = useCallback((fromBlockId: string, toBlockId: string) => {
    setThreads((all) =>
      all.map((t) => (t.blockId === fromBlockId ? { ...t, blockId: toBlockId } : t)),
    )
  }, [])

  const linkTask = useCallback(
    (docId: string, taskId: string, blockId?: string) =>
      change(docId, (doc) => ({
        ...doc,
        taskIds: doc.taskIds.includes(taskId) ? doc.taskIds : [...doc.taskIds, taskId],
        blocks: blockId
          ? doc.blocks?.map((b) => (b.id === blockId && 'text' in b ? { ...b, taskId } : b))
          : doc.blocks,
      })),
    [change],
  )

  const restoreVersion = useCallback(
    (docId: string, versionId: string) =>
      change(docId, (doc) => {
        const version = doc.versions?.find((v) => v.id === versionId)
        return version ? { ...doc, blocks: version.blocks } : doc
      }),
    [change],
  )

  const restoreDoc = useCallback((doc: ProjectDoc) => {
    setDocs((all) => all.map((d) => (d.id === doc.id ? doc : d)))
  }, [])

  const createDoc = useCallback((projectId: string) => {
    const doc: ProjectDoc = {
      id: newId('doc'),
      projectId,
      name: 'Untitled doc',
      kind: 'doc',
      ownerId: me.id,
      updated: 'Just now',
      taskIds: [],
      // One empty line with the caret's placeholder in it, as a new page opens.
      blocks: [{ id: newId('block'), kind: 'paragraph', text: '' }],
      edited: true,
    }
    setDocs((all) => [doc, ...all])
    return doc
  }, [])

  const addThread = useCallback<DocsState['addThread']>((thread, body) => {
    const id = newId('thread')
    setThreads((all) => [
      ...all,
      { ...thread, id, comments: [{ id: newId('c'), authorId: me.id, age: 'Just now', body }] },
    ])
    return id
  }, [])

  const reply = useCallback((threadId: string, body: string) => {
    setThreads((all) =>
      all.map((t) =>
        t.id === threadId
          ? {
              ...t,
              comments: [...t.comments, { id: newId('c'), authorId: me.id, age: 'Just now', body }],
            }
          : t,
      ),
    )
  }, [])

  const setResolved = useCallback((threadId: string, resolved: boolean) => {
    setThreads((all) => all.map((t) => (t.id === threadId ? { ...t, resolved } : t)))
  }, [])

  const value = useMemo<DocsState>(
    () => ({
      docs,
      threads,
      updateBlock,
      renameDoc,
      insertBlock,
      removeBlock,
      editBlocks,
      moveThreads,
      linkTask,
      restoreVersion,
      restoreDoc,
      createDoc,
      addThread,
      reply,
      setResolved,
    }),
    [
      docs,
      threads,
      updateBlock,
      renameDoc,
      insertBlock,
      removeBlock,
      editBlocks,
      moveThreads,
      linkTask,
      restoreVersion,
      restoreDoc,
      createDoc,
      addThread,
      reply,
      setResolved,
    ],
  )

  return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>
}
