-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Map" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Map_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Voxel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "z" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "mapId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Voxel_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Voxel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserOnMap" (
    "mapId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("mapId", "userId"),
    CONSTRAINT "UserOnMap_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserOnMap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Map_userId_key" ON "Map"("userId");
