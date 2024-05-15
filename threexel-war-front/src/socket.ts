import { io } from "socket.io-client"

let socket = io({
  auth: {
    token: localStorage.getItem('authorization')
  }
})

function reloadSocket() {
  socket = io({
    auth: {
      token: localStorage.getItem('authorization')
    }
  })
}

export {
  socket,
  reloadSocket
}