import raw from '../maps/office.json'

export interface TilePos { x: number; y: number }

export interface MapProp {
  id: string; sprite: string
  /** floor footprint in tiles */
  x: number; y: number; w: number; h: number
  /** sprite top-left in pixels */
  px: number; py: number
  blocks: boolean
}

export interface HideSpot {
  id: string; type: string
  x: number; y: number
  enter: TilePos
  prop: string
}

export interface RoomMap {
  grid: { cols: number; rows: number; tile: number; widthPx: number; heightPx: number; wallRows: number }
  tiles: { floor: string[]; wallFront: string; wallTop: string[] }
  wall: { id: string; sprite: string; px: number; py: number }[]
  props: MapProp[]
  decals: { id: string; sprite: string; px: number; py: number }[]
  hideSpots: HideSpot[]
  playerDesk: { x: number; y: number; w: number; h: number; seat: TilePos; prop: string }
  serverDoor: { x: number; y: number; w: number; h: number; golemSlots: TilePos[] }
  entrance: { x: number; y: number; w: number; h: number; spawn: TilePos }
  monsterSpawns: TilePos[]
  /** one string per row, '1' = walkable */
  walkable: string[]
}

export const officeMap = raw as unknown as RoomMap
