import { closestCorners, type CollisionDetection } from '@dnd-kit/core'

/**
 * The collision detection for a board with a spare row (`withSpareRow` in
 * `board.ts`): once the carried block's top edge reaches the spare's top
 * edge, the spare is the target. Above that, `fallback` decides, as it does
 * on any board.
 *
 * `closestCorners` alone never picks the spare from the keyboard. The arrow
 * key moves a carried block to the spare's top-left corner, and there a block
 * a whole row tall still has its corners nearer the row it came from than the
 * spare's, which is a strip — so the block is announced over the row above,
 * and a second arrow has nowhere lower to go. A pointer has the same problem
 * less visibly: the block has to be carried well past the spare before its
 * corners agree. The spare is full width and always last, so "is the block's
 * top in it or below it" is the whole question.
 *
 * Pass the id `spareRow(board)` returns; with none it is just `fallback`.
 */
export function spareRowCollision(
  spare: string | undefined,
  fallback: CollisionDetection = closestCorners,
): CollisionDetection {
  if (spare === undefined) return fallback
  return (args) => {
    // `droppableContainers` is the enabled ones only, so a full spare (it never is) would drop out here.
    const droppableContainer = args.droppableContainers.find((entry) => entry.id === spare)
    const rect = args.droppableRects.get(spare)
    if (droppableContainer && rect && args.collisionRect.top >= rect.top) {
      return [{ id: spare, data: { droppableContainer, value: 0 } }]
    }
    return fallback(args)
  }
}
