import { createContext, type RefObject } from "react";

import type { PanelSide } from "./styles";

/**
 * Set once on `Panel` and read by `Panel.Header` and `Panel.Close`: which
 * heading the title sits in, and how to close the panel from inside it.
 *
 * Deliberately not exported from the barrel.
 */
export interface PanelContextValue {
  headingLevel: 2 | 3 | 4 | 5 | 6;
  close: () => void;
}

export const PanelContext = createContext<PanelContextValue>({
  headingLevel: 2,
  close: () => {},
});

/**
 * What a `Panel` tells a `Panel` written inside it, so the two stack — Base
 * UI's nested-drawer arrangement for an in-flow region. Every panel provides
 * one; a panel that *reads* one is nested, and that is the whole detection.
 *
 * `container` is the **root** panel's `<aside>`, passed straight through by
 * every level, because a nested panel portals into the root: the stack is one
 * region of the page and the root's width is what pushes the page. `side`,
 * `stacked` and `resizing` are the root's for the same reason — a nested
 * panel has no side of its own. `content` is the *immediate* parent's content
 * box, which the nested panel makes `inert` for as long as it is open (see
 * `Panel` for why that is imperative). `report` is how a level tells the ones
 * behind it that it opened or closed; each level forwards it, so the root
 * counts the whole chain and every level counts what is in front of it.
 */
export interface PanelStackContextValue {
  container: HTMLElement | null;
  content: RefObject<HTMLDivElement | null>;
  side: PanelSide;
  stacked: boolean;
  resizing: boolean;
  report: (id: string, open: boolean) => void;
}

export const PanelStackContext = createContext<PanelStackContextValue | null>(
  null,
);
