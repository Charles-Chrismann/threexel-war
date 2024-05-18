import express, { Request, Response } from "express";
import prisma from './PrismaClient'
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";

const router = express.Router()

router.get("/", (request: Request, response: Response) => { 
  response.status(200).send("Hello World");
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, password, confirmPassword } = req.body
    if(password !== confirmPassword) return res.status(400).send({'status': '400', 'message': 'Les mots de passe ne correspondent pas'})
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
    const token = sign({ id: user.id, username: user.username }, process.env.JWT_SECRET!)
    res.status(200).send({'status': '200', 'message': 'success', 'token':token})
  } catch (e: any) {
    if(e instanceof PrismaClientKnownRequestError) return res.sendStatus(409)
    res.sendStatus(500)
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body
  const user = await prisma.user.findUnique({
    where: {
      username
    }
  })
  if(!user || !await compare(password, user.password)) return res.status(401).send({'status': '401', 'message': 'Mauvais identifiants'})
  const token = sign({ id: user.id, username: user.username }, process.env.JWT_SECRET!)
  res.status(200).send({'status': '200', 'message': 'success', 'token':token})
})

router.get('/maps/', async (req: Request, res: Response) => {
  try {
    const maps = await prisma.map.findMany({
      include: {
        voxels: {
          where: {
            isVisible: true
          }
        },
        user: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            username: true
          }
        }
      },
    })
    return res.send(maps)
  } catch (error) {
    res.sendStatus(404)
  }
})

router.get('/maps/:roomName', async (req: Request, res: Response) => {
  try {
    const map = await prisma.map.findFirst({
      where: {
        user: {
          username: req.params.roomName
        }
      },
      include: {
        voxels: {
          where: {
            isVisible: true
          }
        }
      }
    })
    res.send(map?.voxels)
  } catch (error) {
    res.sendStatus(404)
  }
})

export default router