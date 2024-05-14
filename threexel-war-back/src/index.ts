import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import * as http from 'http'
import { Server } from 'socket.io'

const prisma = new PrismaClient()

// configures dotenv to work in your application
const app = express();
const server = http.createServer(app)
const io = new Server(server)

const PORT = 3000;

app.use(express.static('../threexel-war-front/dist'));
app.get("/api/", (request: Request, response: Response) => { 
  response.status(200).send("Hello World");
});

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