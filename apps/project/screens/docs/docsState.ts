import { createContext, useContext } from 'react'

import type { DocBlock, DocThread, ProjectDoc } from '../../data/docs'

export interface DocsState {
  docs: ProjectDoc[]
  threads: DocThread[]
  /** Saves a block's words as you read them, and marks the doc changed by you. */
  updateBlock: (docId: string, blockId: string, text: string) => void
  renameDoc: (docId: string, name: string) => void
  /** Adds a block after `afterId`, or at the end. */
  insertBlock: (docId: string, block: DocBlock, afterId?: string) => void
  removeBlock: (docId: string, blockId: string) => void
  /** Links a task to the doc, and puts its Token on a block when one is named. */
  linkTask: (docId: string, taskId: string, blockId?: string) => void
  /** The doc's blocks become an older version's; its history keeps a "Just now". */
  restoreVersion: (docId: string, versionId: string) => void
  /** Puts a doc back exactly as it was: an Undo. */
  restoreDoc: (doc: ProjectDoc) => void
  /** An untitled doc in a project, yours; returns it. */
  createDoc: (projectId: string) => ProjectDoc
  /** A new thread on part of a doc, opened with your comment; returns its id. */
  addThread: (thread: Omit<DocThread, 'id' | 'comments'>, body: string) => string
  reply: (threadId: string, body: string) => void
  setResolved: (threadId: string, resolved: boolean) => void
}

export const DocsContext = createContext<DocsState | null>(null)

export function useDocs(): DocsState {
  const state = useContext(DocsContext)
  if (!state) throw new Error('useDocs needs the DocsProvider around it')
  return state
}
