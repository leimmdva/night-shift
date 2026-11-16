import { RoomScene } from './RoomScene'

/** The one-room office. Map, props and hide spots come from src/game/maps/office.json. */
export class OfficeScene extends RoomScene {
  constructor() {
    super({ key: 'OfficeScene' })
  }
}
