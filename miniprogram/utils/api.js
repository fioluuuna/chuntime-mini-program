const BASE_URL = "http://127.0.0.1:3007/api"

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
          resolve(res.data)
          return
        }
        reject(new Error(res.data?.error || `Request failed: ${res.statusCode}`))
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

function getConfig() {
  return request("/config")
}

function getProducts() {
  return request("/products")
}

function updateProductStock(productId, stock) {
  return request(`/products/${productId}`, {
    method: "PATCH",
    data: { stock }
  })
}

function getOrders() {
  return request("/orders")
}

function createOrder(payload) {
  return request("/orders", {
    method: "POST",
    data: payload
  })
}

function getMember() {
  return request("/member")
}

function getDashboard() {
  return request("/dashboard")
}

function resetDemo() {
  return request("/reset-demo", { method: "POST" })
}

module.exports = {
  BASE_URL,
  getConfig,
  getProducts,
  updateProductStock,
  getOrders,
  createOrder,
  getMember,
  getDashboard,
  resetDemo
}

