import './style.css'
import { setupCounter } from './counter.ts'
import { io } from "socket.io-client";

const socket = io()
socket.on('message', (msg) => {
  console.log(msg)
})

fetch('/api').then(res => res.json()).then(res => console.log('lares', res))

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
