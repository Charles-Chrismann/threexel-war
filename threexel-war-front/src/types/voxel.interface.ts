export default interface Voxel {
  id: string,
  createdAt: string,
  updatedAt: string,
  x: number,
  y: number,
  z: number,
  color: string,
  isVisible: boolean,
  mapId: number,
  userId: number
}