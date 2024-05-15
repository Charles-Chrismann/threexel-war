import User from "./user.interface"
import Voxel from "./voxel.interface"

export default interface Map {
  id: string,
  createdAt: string,
  updatedAt: string,
  userId: number
  voxels: Voxel[]
  user: User
}