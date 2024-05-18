import 'dotenv/config'
import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import * as http from 'http'
import * as https from 'http'
import * as fs from 'fs'
import { Server, Socket } from 'socket.io'
import { compare, hash } from 'bcrypt'
import { sign, verify } from 'jsonwebtoken'
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
import appRouter from './app.route'
import prisma from './PrismaClient'

declare module 'socket.io' {
  export interface Socket {
    user: {
      id: number;
      username: string;
    };
  }
}



// configures dotenv to work in your application
const app = express();
const server = http.createServer(app)
const io = new Server(server)

const PORT = process.env.PORT || 3000;

const privateKey = fs.readFileSync(process.env.PRIVKEY_PATH!, 'utf8');
const certificate = fs.readFileSync(process.env.CERT_PATH!, 'utf8');
const ca = fs.readFileSync(process.env.CHAIN_PATH!, 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

const httpsServer = https.createServer(credentials as any, app);

app.use(express.json())
app.use(express.static('../threexel-war-front/dist'));

app.use('/api', appRouter)

io.on('connection', (socket) => {
  console.log('user connecyted', socket.handshake.auth.token)
  socket.emit('message', {hello: "les jeunes"})

  socket.on('identification', (token) => {
    if(!token) return
    try {
      const payload = verify(token, process.env.JWT_SECRET!) as { id: number, username: string }
      socket.user = payload
    } catch (error: unknown) {
      
    }
  })

  socket.on('join room', async (roomId: string) => {
    socket.rooms.forEach(room => {if (room !== socket.id) {socket.leave(room);}});
    socket.join(roomId)
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
    socket.emit('join room', roomData)
  })

  socket.on('place', async (voxel: { x: number, y: number, z: number, color: string, roomName: string }) => {
    if(!socket.user || !voxel.roomName) return
    const txResult = await prisma.$transaction(async (tx) => {
      const map = await tx.map.findFirst({
        where: {
          user: {
            username: voxel.roomName
          }
        }
      })
      if(!map) return
      console.log('eee')
      const createdVoxel = await tx.voxel.create({
        data: {
          x: voxel.x,
          y: voxel.y,
          z: voxel.z,
          isVisible: true,
          color: voxel.color,
          mapId: map.id,
          userId: socket.user.id
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
    io.to(voxel.roomName).emit('update voxel', txResult)
  })


  socket.on('delete', async (voxel: { x: number, y: number, z: number, roomName: string }) => {
    if (!socket.user) return;
  
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
  
      io.to(voxel.roomName).emit('delete voxel', deletedVoxel);
    } catch (error) {
      console.error("Error deleting voxel:", error);
    }
  });
  
})

server.listen(PORT, () => { 
  console.log("Server running at PORT: ", PORT); 
}).on("error", (error) => {
  // gracefully handle error
  throw new Error(error.message);
});

httpsServer.listen(process.env.HTTPS_PORT, () => {
	console.log(`HTTPS Server running on port ${process.env.HTTPS_PORT}`);
});