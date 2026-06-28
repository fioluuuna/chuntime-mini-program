const localDb = require("./local-db")

const BASE_URL = "http://127.0.0.1:3007/api"

let serviceMode = "remote"

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method: options.method || "GET",
      data: options.data || undefined,
      header: {
        "Content-Type": "application/json",
        ...(options.header || {}),
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          serviceMode = "remote"
          resolve(res.data)
          return
        }
        const error = new Error(res.data?.error || `Request failed: ${res.statusCode}`)
        error.statusCode = res.statusCode
        reject(error)
      },
      fail(err) {
        reject(err)
      },
    })
  })
}

async function withFallback(remoteTask, localTask) {
  try {
    return await remoteTask()
  } catch (error) {
    if (error && error.statusCode) {
      throw error
    }
    serviceMode = "local"
    return localTask(error)
  }
}

function getConfig() {
  return withFallback(() => request("/config"), () => localDb.getConfig())
}

function ownerLogin(code) {
  return withFallback(
    () =>
      request("/owner-login", {
        method: "POST",
        data: { code },
      }),
    () => localDb.ownerLogin(code)
  )
}

function getProducts() {
  return withFallback(() => request("/products"), () => localDb.getProducts())
}

function addProduct(payload) {
  return withFallback(
    () =>
      request("/products", {
        method: "POST",
        data: payload,
      }),
    () => localDb.addProduct(payload)
  )
}

function updateProduct(productId, payload) {
  return withFallback(
    () =>
      request(`/products/${productId}`, {
        method: "PATCH",
        data: payload,
      }),
    () => localDb.updateProduct(productId, payload)
  )
}

function deleteProduct(productId) {
  return withFallback(
    () =>
      request(`/products/${productId}`, {
        method: "DELETE",
      }),
    () => localDb.deleteProduct(productId)
  )
}

function updateProductStock(productId, stock) {
  return updateProduct(productId, { stock })
}

function getCombos() {
  return withFallback(() => request("/combos"), () => localDb.getCombos())
}

function addCombo(payload) {
  return withFallback(
    () =>
      request("/combos", {
        method: "POST",
        data: payload,
      }),
    () => localDb.addCombo(payload)
  )
}

function updateCombo(comboId, payload) {
  return withFallback(
    () =>
      request(`/combos/${comboId}`, {
        method: "PATCH",
        data: payload,
      }),
    () => localDb.updateCombo(comboId, payload)
  )
}

function deleteCombo(comboId) {
  return withFallback(
    () =>
      request(`/combos/${comboId}`, {
        method: "DELETE",
      }),
    () => localDb.deleteCombo(comboId)
  )
}

function getMaterials() {
  return withFallback(() => request("/materials"), () => localDb.getMaterials())
}

function addMaterial(payload) {
  return withFallback(
    () =>
      request("/materials", {
        method: "POST",
        data: payload,
      }),
    () => localDb.addMaterial(payload)
  )
}

function updateMaterial(materialId, payload) {
  return withFallback(
    () =>
      request(`/materials/${materialId}`, {
        method: "PATCH",
        data: payload,
      }),
    () => localDb.updateMaterial(materialId, payload)
  )
}

function deleteMaterial(materialId) {
  return withFallback(
    () =>
      request(`/materials/${materialId}`, {
        method: "DELETE",
      }),
    () => localDb.deleteMaterial(materialId)
  )
}

function getOrders() {
  return withFallback(() => request("/orders"), () => localDb.getOrders())
}

function getOrderById(orderId) {
  return withFallback(() => request(`/orders/${orderId}`), () => localDb.getOrderById(orderId))
}

function createOrder(payload) {
  return withFallback(
    () =>
      request("/orders", {
        method: "POST",
        data: payload,
      }),
    () => localDb.createOrder(payload)
  )
}

function markOrderPaid(orderId) {
  return withFallback(
    () =>
      request(`/orders/${orderId}/mark-paid`, {
        method: "POST",
      }),
    () => localDb.markOrderPaid(orderId)
  )
}

function updateOrderStatus(orderId, status) {
  return withFallback(
    () =>
      request(`/orders/${orderId}`, {
        method: "PATCH",
        data: { status },
      }),
    () => localDb.updateOrderStatus(orderId, status)
  )
}

function getMember() {
  return withFallback(() => request("/member"), () => localDb.getMember())
}

function getLedger(date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : ""
  return withFallback(() => request(`/ledger${query}`), () => localDb.getLedger(date))
}

function addLedgerIncome(payload) {
  return withFallback(
    () =>
      request("/ledger/income", {
        method: "POST",
        data: payload,
      }),
    () => localDb.addLedgerIncome(payload)
  )
}

function addLedgerExpense(payload) {
  return withFallback(
    () =>
      request("/ledger/expense", {
        method: "POST",
        data: payload,
      }),
    () => localDb.addLedgerExpense(payload)
  )
}

function getDashboard() {
  return withFallback(() => request("/dashboard"), () => localDb.getDashboard())
}

function uploadImageBase64(payload) {
  return withFallback(
    () =>
      request("/uploads/base64", {
        method: "POST",
        data: payload,
      }),
    () => Promise.resolve({ url: payload.filePath || "", path: payload.filePath || "" })
  )
}

function resetDemo() {
  return withFallback(
    () => request("/reset-demo", { method: "POST" }),
    () => Promise.resolve({ ok: true, store: localDb.resetStore() })
  )
}

module.exports = {
  BASE_URL,
  request,
  getConfig,
  ownerLogin,
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getCombos,
  addCombo,
  updateCombo,
  deleteCombo,
  getMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  getSupplies: getMaterials,
  updateSupply: updateMaterial,
  getOrders,
  getOrderById,
  createOrder,
  markOrderPaid,
  updateOrderStatus,
  getMember,
  getDashboard,
  getLedger,
  addLedgerIncome,
  addLedgerExpense,
  uploadImageBase64,
  resetDemo,
  getServiceMode() {
    return serviceMode
  },
}
