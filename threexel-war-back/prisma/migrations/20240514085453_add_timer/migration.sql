/*
  Warnings:

  - Added the required column `lastPlaced` to the `UserOnMap` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserOnMap" (
    "mapId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "lastPlaced" DATETIME NOT NULL,

    PRIMARY KEY ("mapId", "userId"),
    CONSTRAINT "UserOnMap_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserOnMap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserOnMap" ("mapId", "userId") SELECT "mapId", "userId" FROM "UserOnMap";
DROP TABLE "UserOnMap";
ALTER TABLE "new_UserOnMap" RENAME TO "UserOnMap";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
