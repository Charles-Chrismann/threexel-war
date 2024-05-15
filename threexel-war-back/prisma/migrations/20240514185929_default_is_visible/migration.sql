-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Voxel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "z" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "mapId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Voxel_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Voxel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Voxel" ("color", "createdAt", "id", "isVisible", "mapId", "updatedAt", "userId", "x", "y", "z") SELECT "color", "createdAt", "id", "isVisible", "mapId", "updatedAt", "userId", "x", "y", "z" FROM "Voxel";
DROP TABLE "Voxel";
ALTER TABLE "new_Voxel" RENAME TO "Voxel";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
