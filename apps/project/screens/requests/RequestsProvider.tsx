import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import { me } from '../../data/people'
import {
  creativeForm,
  intakeRequests,
  myRequests,
  type FormQuestion,
  type IntakeRequest,
  type MyRequest,
} from '../../data/requests'
import type { TaskComment } from '../../data/types'
import { RequestsContext, type RequestsState } from './requestsState'

/** The file's Thursday, which is the day every change here is dated. */
const TODAY = '2026-11-05'

let made = 0
const newId = (prefix: string) => `${prefix}-new-${++made}`

function yours(body: string): TaskComment {
  return { id: newId('c'), authorId: me.id, age: 'Just now', body }
}

/**
 * Requests, held above the router like the tasks and the inbox, so a request
 * accepted in the queue stays accepted, the task it became is in its project,
 * and a question edited in the builder is the question the form asks.
 */
export function RequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState(intakeRequests)
  const [mine, setMine] = useState(myRequests)
  const [form, setForm] = useState(creativeForm)

  // Every queue change pushes what the queue was, so Undo can step back through them.
  const history = useRef<{ requests: IntakeRequest[]; also?: () => void }[]>([])
  const current = useRef(requests)
  current.current = requests
  const remember = useCallback((also?: () => void) => {
    history.current.push({ requests: current.current, also })
  }, [])
  const undo = useCallback(() => {
    const last = history.current.pop()
    if (!last) return
    setRequests(last.requests)
    last.also?.()
  }, [])

  const change = useCallback((id: string, update: (r: IntakeRequest) => IntakeRequest) => {
    setRequests((all) => all.map((r) => (r.id === id ? update(r) : r)))
  }, [])

  const accept = useCallback(
    (id: string, taskId: string, reply: string, merged?: boolean) =>
      change(id, (r) => ({
        ...r,
        state: 'accepted',
        waiting: undefined,
        accepted: { taskId, on: TODAY, merged },
        conversation: reply.trim() ? [...r.conversation, yours(reply.trim())] : r.conversation,
      })),
    [change],
  )
  const decline = useCallback(
    (id: string, note: string) =>
      change(id, (r) => ({
        ...r,
        state: 'declined',
        waiting: undefined,
        declined: { on: TODAY, note },
      })),
    [change],
  )
  const reopen = useCallback(
    (id: string) => change(id, (r) => ({ ...r, state: 'new', declined: undefined })),
    [change],
  )
  const askForInfo = useCallback(
    (id: string, body: string) =>
      change(id, (r) => ({
        ...r,
        state: 'waiting',
        waiting: { since: TODAY, nudge: 'Monday' },
        conversation: [...r.conversation, yours(body)],
      })),
    [change],
  )
  const reply = useCallback(
    (id: string, body: string) =>
      change(id, (r) => ({ ...r, conversation: [...r.conversation, yours(body)] })),
    [change],
  )
  const nudge = useCallback(
    (id: string) =>
      change(id, (r) => (r.waiting ? { ...r, waiting: { ...r.waiting, nudged: true } } : r)),
    [change],
  )
  const keepBoth = useCallback(
    (id: string) => change(id, (r) => ({ ...r, duplicateOf: undefined })),
    [change],
  )

  const submit = useCallback((request: MyRequest) => setMine((all) => [request, ...all]), [])
  const answerMine = useCallback(
    (id: string, body: string) =>
      setMine((all) =>
        all.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'submitted',
                updated: TODAY,
                updatedAge: 'Just now',
                question: undefined,
                replies: [...(r.replies ?? []), yours(body)],
                steps: [
                  ...r.steps.map((s) => ({ ...s, current: false })),
                  { text: 'You answered', date: TODAY },
                ],
              }
            : r,
        ),
      ),
    [],
  )

  const saveQuestion = useCallback(
    (question: FormQuestion) =>
      setForm((f) => ({
        ...f,
        questions: f.questions.map((q) => (q.id === question.id ? question : q)),
      })),
    [],
  )
  const addQuestion = useCallback(() => {
    const question: FormQuestion = {
      id: newId('q'),
      label: 'Untitled question',
      type: 'short-text',
      required: false,
    }
    setForm((f) => ({ ...f, questions: [...f.questions, question] }))
    return question
  }, [])
  const orderQuestions = useCallback(
    (ids: string[]) =>
      setForm((f) => ({
        ...f,
        questions: ids
          .map((id) => f.questions.find((q) => q.id === id))
          .filter((q): q is FormQuestion => Boolean(q)),
      })),
    [],
  )
  const setPublished = useCallback(
    (published: boolean) => setForm((f) => ({ ...f, published })),
    [],
  )
  const setAccess = useCallback((access: string) => setForm((f) => ({ ...f, access })), [])
  const setResponses = useCallback((responses: string) => setForm((f) => ({ ...f, responses })), [])

  const value = useMemo<RequestsState>(
    () => ({
      requests,
      mine,
      form,
      accept,
      decline,
      reopen,
      askForInfo,
      reply,
      nudge,
      keepBoth,
      remember,
      undo,
      submit,
      answerMine,
      saveQuestion,
      addQuestion,
      orderQuestions,
      setPublished,
      setAccess,
      setResponses,
    }),
    [
      requests,
      mine,
      form,
      accept,
      decline,
      reopen,
      askForInfo,
      reply,
      nudge,
      keepBoth,
      remember,
      undo,
      submit,
      answerMine,
      saveQuestion,
      addQuestion,
      orderQuestions,
      setPublished,
      setAccess,
      setResponses,
    ],
  )
  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>
}
