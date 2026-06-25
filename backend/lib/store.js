const fs = require("fs")
const path = require("path")
const { defaultStore } = require("./seed")

const dataDir = path.join(__dirname, "..", "data")
const dbPath = path.join(dataDir, "store.json")

function ensureDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function ensureDb() {
  ensureDir()
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultStore, null, 2), "utf8")
  }
}

function readStore() {
  ensureDb()
  return JSON.parse(fs.readFileSync(dbPath, "utf8"))
}

function writeStore(nextStore) {
  ensureDb()
  fs.writeFileSync(dbPath, JSON.stringify(nextStore, null, 2), "utf8")
  return nextStore
}

function resetStore() {
  return writeStore(clone(defaultStore))
}

module.exports = {
  dbPath,
  readStore,
  writeStore,
  resetStore
}

