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
        ...(options.header || {})
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
      }
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

function getProducts() {
  return withFallback(() => request("/products"), () => localDb.getProducts())
}

function updateProductStock(productId, stock) {
  return withFallback(
    () =>
      request(`/products/${productId}`, {
        method: "PATCH",
        data: { stock }
      }),
    () => localDb.updateProductStock(productId, stock)
  )
}

function getOrders() {
  return withFallback(() => request("/orders"), () => localDb.getOrders())
}

function createOrder(payload) {
  return withFallback(
    () =>
      request("/orders", {
        method: "POST",
        data: payload
      }),
    () => localDb.createOrder(payload)
  )
}

function updateOrderStatus(orderId, status) {
  return withFallback(
    () =>
      request(`/orders/${orderId}`, {
        method: "PATCH",
        data: { status }
      }),
    () => localDb.updateOrderStatus(orderId, status)
  )
}

function getMember() {
  return withFallback(() => request("/member"), () => localDb.getMember())
}

function getDashboard() {
  return withFallback(() => request("/dashboard"), () => localDb.getDashboard())
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
  getProducts,
  updateProductStock,
  getOrders,
  createOrder,
  updateOrderStatus,
  getMember,
  getDashboard,
  resetDemo,
  getServiceMode() {
    return serviceMode
  }
}
