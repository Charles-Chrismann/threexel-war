import express, { Request, Response } from "express";
import * as http from 'http'
import { Server } from 'socket.io'

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
})

server.listen(PORT, () => { 
  console.log("Server running at PORT: ", PORT); 
}).on("error", (error) => {
  // gracefully handle error
  throw new Error(error.message);
});