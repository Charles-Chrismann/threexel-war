import { verify } from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import prisma from "../PrismaClient";

declare module 'socket.io' {
    export interface Socket {
      user: {
        id: number;
        username: string;
      };
    }
  }

export default class SocketInteraction {

  constructor(private socket: Socket, private io: Server) {
    this.connection();
  }

  connection() {
    console.log('user connecyted', this.socket.handshake.auth.token)
    this.socket.emit('message', {hello: "les jeunes"})


    // we are use Arrow functions to keep the this context
    this.socket.on('identification', this.identification)
    this.socket.on('join room', this.joinRoom)
    this.socket.on('place', this.place)
    this.socket.on('delete', this.delete)
  }

  identification = (token: string) => {
    if(!token) return
    try {
      const payload = verify(token, process.env.JWT_SECRET!) as { id: number, username: string }
      this.socket.user = payload
    } catch (error: unknown) {
      console.error('Invalid Token')
    }
  }

  joinRoom = async (roomId: string) => {
    this.socket.rooms.forEach(room => {if (room !== this.socket.id) {this.socket.leave(room);}});
    this.socket.join(roomId)
    const roomData = await prisma.map.findFirst({
      where: {
        user: {
          username: roomId
        }
      },
      include: {
        user: true,
        voxels: true,
        UserOnMap: {
          where: {
            user: {
              username: roomId
            }
          }
        }
      }
    })
    this.socket.emit('join room', roomData)
  }

  place = async (voxel: { x: number, y: number, z: number, color: string, roomName: string }) => {
    if(!this.socket.user || !voxel.roomName) return
    const txResult = await prisma.$transaction(async (tx) => {
      const map = await tx.map.findFirst({
        where: {
          user: {
            username: voxel.roomName
          }
        }
      })
      if(!map) return
      const createdVoxel = await tx.voxel.create({
        data: {
          x: voxel.x,
          y: voxel.y,
          z: voxel.z,
          isVisible: true,
          color: voxel.color,
          mapId: map.id,
          userId: this.socket.user.id
        }
      })
      // await tx.userOnMap.update({
      //   where: {
      //     mapId_userId: {
      //       mapId: map.id,
      //       userId: socket.user.id
      //     }
      //   },
      //   data: {
      //     lastPlaced: new Date()
      //   }
      // })
      return createdVoxel
    })
    if(!txResult) return
    console.log(txResult)
    this.io.to(voxel.roomName).emit('update voxel', txResult)
  }

  delete = async (voxel: { x: number, y: number, z: number, color: string, roomName: string }) => {
    if (!this.socket.user) return;
  
    try {
      const map = await prisma.map.findFirst({
        where: {
          user: {
            username: voxel.roomName
          }
        }
      });
  
      if (!map) return;
  
      const voxelToDelete = await prisma.voxel.findFirst({
        where: {
          x: voxel.x,
          y: voxel.y,
          z: voxel.z,
          mapId: map.id,
          isVisible: true
        }
      });
  
      if (!voxelToDelete) return;
  
      const deletedVoxel = await prisma.voxel.update({
        where: {
          id: voxelToDelete.id
        },
        data: {
          isVisible: false,
          updatedAt: new Date()
        }
      });
  
      this.io.to(voxel.roomName).emit('delete voxel', deletedVoxel);
    } catch (error) {
      console.error("Error deleting voxel:", error);
    }
  }
}