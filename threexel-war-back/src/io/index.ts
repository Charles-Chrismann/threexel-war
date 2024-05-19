import { Server } from "socket.io";
import * as http from 'http'
import SocketInteraction from "./io.controller";

let io: Server

function createIoServer(httpServer: http.Server) {
  io = new Server(httpServer)

  io.on('connection', (socket) => {
    new SocketInteraction(socket, io)
  })

  return io
}

export { createIoServer }