import 'dotenv/config'
import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import * as http from 'http'
import { Server, Socket } from 'socket.io'
import { compare, hash } from 'bcrypt'
import { sign, verify } from 'jsonwebtoken'
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";

declare module 'socket.io' {
  export interface Socket {
    user: {
      id: number;
      username: string;
    };
  }
}

const prisma = new PrismaClient()

// configures dotenv to work in your application
const app = express();
const server = http.createServer(app)
const io = new Server(server)

const PORT = 3000;

app.use(express.json())
app.use(express.static('../threexel-war-front/dist'));
app.get("/api/", (request: Request, response: Response) => { 
  response.status(200).send("Hello World");
});

app.post("/api/register", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    const passwordHash = await hash(password, 10)
    const user = await prisma.user.create({
      data: {
        username,
        password: passwordHash,
        map: {
          create: {}
        }
      }
    })
    res.send(user);
  } catch (e: any) {
    if(e instanceof PrismaClientKnownRequestError) return res.sendStatus(409)
    res.sendStatus(500)
  }
});

app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body
  const user = await prisma.user.findUnique({
    where: {
      username
    }
  })
  console.log(user)
  if(!user) return res.sendStatus(401)
  if(!await compare(password, user.password)) return res.sendStatus(401)
  const token = sign({ id: user.id, username: user.username }, process.env.JWT_SECRET!)
  res.send(token)
})

io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if(!token) return next()
    try {
      const payload = verify(token, process.env.JWT_SECRET!) as { id: number, username: string }
      socket.user = payload
      next();
    } catch (error: unknown) {
      
    }
});

io.on('connection', (socket) => {
  console.log('user connecyted', socket.handshake.auth.token)
  socket.emit('message', {hello: "les jeunes"})

  socket.on('join room', async (roomId: string, userId: number) => {
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
            userId
          }
        }
      }
    })
    socket.emit('join room', roomData)
  })

  socket.on('place', async (voxel: { x: number, y: number, z: number, color: string, roomName: string }) => {
    if(!socket.user) return
    const txResult = await prisma.$transaction(async (tx) => {
      const map = await tx.map.findFirst({
        where: {
          user: {
            username: voxel.roomName
          }
        }
      })
      if(!map) return
      const createdVoxel = tx.voxel.create({
        data: {
          x: voxel.x,
          y: voxel.y,
          z: voxel.z,
          color: voxel.color,
          mapId: map.id,
          userId: socket.user.id
        }
      })
      tx.userOnMap.update({
        where: {
          mapId_userId: {
            mapId: map.id,
            userId: socket.user.id
          }
        },
        data: {
          lastPlaced: new Date()
        }
      })
      return true
    })
    if(!txResult) return
    console.log(voxel)
    io.emit('update voxel', voxel)
  })
})

server.listen(PORT, () => { 
  console.log("Server running at PORT: ", PORT); 
}).on("error", (error) => {
  // gracefully handle error
  throw new Error(error.message);
});