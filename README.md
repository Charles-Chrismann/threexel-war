# THREEXEL-WAR

Threexel-war is project made by [@Tom-Tamen](https://github.com/tom-tamen) and [@Charles-Chrismann](https://github.com/charles-chrismann) in order to learn real time interactions between a server and one or plus clients.

The main dependencies are:
  - Backend:
    - express
    - prisma
    - jsonwebtoken
    - dotenv
    - socket.io
  - Front-end:
    - three (Three.js)
    - socket.io-client

## Setup

Clone projet

```sh
git clone https://github.com/Charles-Chrismann/threexel-war.git
```

Install dependencies

```sh
cd ./threexel-war/threexel-war-front
npm i
cd ../threexel-war-back/
npm i
```

Generate prisam artifacts and migrate database:

```sh
# in threexel-war-back/
npx prisma migrate reset
```

Copy and rename .env.example in .env, next edit path to your ssl certificates, private key and ca.

## Run projet

as dev:

```sh
# root
npm run dev:back
```

```sh
# root
npm run dev:front
```

as prod:

```sh
# root
npm run build:back
npm run start:back
```

```sh
# root
npm run build:front
```