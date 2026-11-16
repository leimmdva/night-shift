import type { BugPack } from '../../types/BugPack'
import nullGhost from '../../bugs/01-null-ghost'
import offByOne from '../../bugs/02-off-by-one'
import infiniteCrawler from '../../bugs/03-infinite-crawler'

/** Every pack that exists so far, in play order. Packs 04–08 are added with their milestones. */
export const QUEUE: BugPack[] = [nullGhost, offByOne, infiniteCrawler].sort((a, b) => a.order - b.order)

/** The first pack that is neither solved nor cut, or null when the run is over. */
export function nextBug(
  solved: readonly string[],
  cut: readonly string[] = [],
  packs: readonly BugPack[] = QUEUE
): BugPack | null {
  return packs.find((p) => !solved.includes(p.id) && !cut.includes(p.id)) ?? null
}
