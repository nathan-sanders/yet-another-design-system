import { createContext, useContext } from 'react'

import type { FormQuestion, IntakeRequest, MyRequest, RequestForm } from '../../data/requests'

export interface RequestsState {
  /** The queue: every request anyone sent, whatever has been done with it. */
  requests: IntakeRequest[]
  /** The requests you made. */
  mine: MyRequest[]
  form: RequestForm

  /** Accepts a request as a task (`taskId`), with your reply in its conversation. */
  accept: (id: string, taskId: string, reply: string, merged?: boolean) => void
  decline: (id: string, note: string) => void
  /** Puts a declined request back in New. */
  reopen: (id: string) => void
  /** Asks the person who sent it a question, which moves it to Waiting until they answer. */
  askForInfo: (id: string, body: string) => void
  /** Adds to a waiting request's conversation; it keeps waiting. */
  reply: (id: string, body: string) => void
  /** Nudges the person a request waits on now, rather than on Yak's day. */
  nudge: (id: string) => void
  /** Keep both: drops the possible-duplicate flag, so the request reads like any other. */
  keepBoth: (id: string) => void

  /**
   * Saves the queue as it is, so the next change can be undone; `also`
   * undoes what it did elsewhere — a task made, a task merged into.
   */
  remember: (also?: () => void) => void
  undo: () => void

  /** A request you just submitted, at the top of My requests. */
  submit: (request: MyRequest) => void
  /** Answers the question a request of yours is waiting on. */
  answerMine: (id: string, body: string) => void

  saveQuestion: (question: FormQuestion) => void
  /** Adds a blank Short text question at the end, and returns it so it can be opened. */
  addQuestion: () => FormQuestion
  /** Puts the questions in this order, by id. */
  orderQuestions: (ids: string[]) => void
  setPublished: (published: boolean) => void
  setAccess: (access: string) => void
  setResponses: (responses: string) => void
}

export const RequestsContext = createContext<RequestsState | null>(null)

export function useRequests(): RequestsState {
  const state = useContext(RequestsContext)
  if (!state) throw new Error('useRequests needs the RequestsProvider around it')
  return state
}
