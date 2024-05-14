import 'dotenv/config'
import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import * as http from 'http'
import { Server } from 'socket.io'
import { compare, hash } from 'bcrypt'
import { sign } from 'jsonwebtoken'
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";

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
    if(e instanceof PrismaClientKnownRequestError) res.sendStatus(409)
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
  if(await compare(password, user.password)) return res.sendStatus(401)
  const token = sign({ id: user.id, username: user.username }, process.env.JWT_SECRET!)
  res.send(token)
})

io.on('connection', (socket) => {
  console.log('user connecyted')
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
})

server.listen(PORT, () => { 
  console.log("Server running at PORT: ", PORT); 
}).on("error", (error) => {
  // gracefully handle error
  throw new Error(error.message);
});