import "server-only"

import fs from "node:fs"
import path from "node:path"

import Database from "better-sqlite3"

import { runMigrations } from "@/lib/db/migrations"

const databasePath = path.join(process.cwd(), "data", "net-worth.sqlite")

let db: Database.Database | null = null

export function getDb() {
  if (!db) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true })
    db = new Database(databasePath)
    db.pragma("foreign_keys = ON")
    runMigrations(db)
  }

  return db
}
