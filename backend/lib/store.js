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

function normalizeStore(store) {
  if (!store || Number(store.schemaVersion || 0) < Number(defaultStore.schemaVersion || 1)) {
    return clone(defaultStore)
  }
  return store
}

function readStore() {
  ensureDb()
  const current = JSON.parse(fs.readFileSync(dbPath, "utf8"))
  const normalized = normalizeStore(current)
  if (normalized !== current) {
    fs.writeFileSync(dbPath, JSON.stringify(normalized, null, 2), "utf8")
  }
  return normalized
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
  resetStore,
}
