import 'dotenv/config'
import express from "express";
import * as http from 'http'
import * as https from 'http'
import * as fs from 'fs'
import appRouter from './app.route'
import { createIoServer } from './io';

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3001;
let credentials = {}
try {
  const privateKey = fs.readFileSync(process.env.PRIVKEY_PATH!, 'utf8');
  const certificate = fs.readFileSync(process.env.CERT_PATH!, 'utf8');
  const ca = fs.readFileSync(process.env.CHAIN_PATH!, 'utf8');
  
  credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
  };
} catch (e: unknown) {

}

const app = express();
const server = http.createServer(app)
const httpsServer = https.createServer(credentials as any, app);
const io = createIoServer(server)

app.use(express.json())
app.use(express.static('../threexel-war-front/dist'));
app.use('/api', appRouter)

server.listen(PORT, () => { 
  console.log('\x1b[32m%s\x1b[0m', "Server running at PORT: " + PORT); 
}).on("error", (error) => {
  throw new Error(error.message);
});

if(Object.keys(credentials).length === 0) console.log('\x1b[33m%s\x1b[0m', 'SSL data not found: HTTPS server not started'); 
else {
  httpsServer.listen(HTTPS_PORT, () => {
    console.log('\x1b[32m%s\x1b[0m', `HTTPS Server running on port ${process.env.HTTPS_PORT}`);
  }).on("error", (error) => {
    throw new Error(error.message);
  });
} 