const http = require("http")
const { URL } = require("url")
const { readStore, writeStore, resetStore } = require("./lib/store")

const port = process.env.PORT || 3007

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data)
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  })
  res.end(body)
}

function notFound(res) {
  sendJson(res, 404, { error: "Not found" })
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk
    })
    req.on("end", () => {
      if (!body) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })
    req.on("error", reject)
  })
}

function buildDashboard(store) {
  const totalRevenue = store.orders.reduce((sum, order) => sum + (order.totals?.total || 0), 0)
  const preorderCount = store.orders.filter((order) => order.status !== "已完成").length
  const soupMap = {}
  const hourMap = {}
  const customerMap = {}

  for (const order of store.orders) {
    const match = String(order.createdAt || "").match(/(\d{1,2}):\d{2}/)
    const hourLabel = match
      ? `${String(Number(match[1])).padStart(2, "0")}:00-${String(Number(match[1]) + 1).padStart(2, "0")}:00`
      : "未知时段"
    hourMap[hourLabel] = (hourMap[hourLabel] || 0) + 1

    const customerKey = order.phone || order.name
    customerMap[customerKey] = customerMap[customerKey] || {
      name: order.name || "顾客",
      phone: order.phone || "",
      count: 0,
      amount: 0
    }
    customerMap[customerKey].count += 1
    customerMap[customerKey].amount += Number(order.totals?.total || 0)

    for (const item of order.items || []) {
      if (item.parts?.length) {
        const soupPart = item.parts.find((part) => String(part.productId).startsWith("soup-"))
        if (soupPart) {
          soupMap[soupPart.productName] = (soupMap[soupPart.productName] || 0) + item.quantity
        }
      } else if (String(item.productId).startsWith("soup-")) {
        soupMap[item.productName] = (soupMap[item.productName] || 0) + item.quantity
      }
    }
  }

  return {
    summaryCards: [
      { label: "累计订单", value: store.orders.length },
      { label: "累计销售额", value: `¥${totalRevenue.toFixed(2)}` },
      { label: "待处理订单", value: preorderCount },
      { label: "在售库存", value: store.products.reduce((sum, item) => sum + item.stock, 0) }
    ],
    stocks: store.products
      .filter((item) => item.category === "soup")
      .map((item) => ({
        id: item.id,
        name: item.name,
        reserved: 0,
        stock: item.stock,
        remaining: item.stock
      })),
    analytics: {
      topSoups: Object.keys(soupMap)
        .map((name) => ({ name, count: soupMap[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topHours: Object.keys(hourMap)
        .map((hour) => ({ hour, count: hourMap[hour] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topCustomers: Object.values(customerMap)
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count
          return b.amount - a.amount
        })
        .slice(0, 5)
        .map((item) => ({
          ...item,
          amount: `¥${item.amount.toFixed(2)}`
        }))
    },
    reportText: "先确认库存，再根据当日接单情况手动开售。后台保留数据分析、库存确认和订单流转，不强行做采购推算。"
  }
}

function updateOrderStatus(store, orderId, status) {
  const order = store.orders.find((item) => item.id === orderId)
  if (!order) {
    throw new Error("订单不存在")
  }
  order.status = status
  return order
}

function applyOrder(store, payload) {
  const items = Array.isArray(payload.items) ? payload.items : []
  if (!items.length) {
    throw new Error("订单不能为空")
  }

  for (const item of items) {
    if (item.parts?.length) {
      for (const part of item.parts) {
        const product = store.products.find((entry) => entry.id === part.productId)
        if (!product || product.stock < part.quantity) {
          throw new Error(`${part.productName} 库存不足`)
        }
      }
    } else {
      const product = store.products.find((entry) => entry.id === item.productId)
      if (product && product.stock < item.quantity) {
        throw new Error(`${item.productName} 库存不足`)
      }
    }
  }

  for (const item of items) {
    if (item.parts?.length) {
      for (const part of item.parts) {
        const product = store.products.find((entry) => entry.id === part.productId)
        product.stock -= part.quantity
      }
    } else {
      const product = store.products.find((entry) => entry.id === item.productId)
      if (product) {
        product.stock -= item.quantity
      }
    }
  }

  const order = {
    id: `CT${Date.now()}`,
    name: payload.customerName || "顾客",
    phone: payload.phone || "",
    fulfillmentType: payload.fulfillmentType || "自提",
    address: payload.address || "",
    remark: payload.remark || "",
    items,
    totals: payload.totals,
    status: "待接单",
    createdAt: new Date().toLocaleString("zh-CN", { hour12: false })
  }

  store.orders.unshift(order)
  store.member.points += Math.floor(payload.totals?.total || 0)
  store.member.orderCount += 1
  store.member.lastOrderAt = order.createdAt
  if (store.member.orderCount >= 10) {
    store.member.membership = "金卡会员"
  } else if (store.member.orderCount >= 5) {
    store.member.membership = "银卡会员"
  }
  return order
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true })
    return
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const store = readStore()

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, service: "chuntime-backend" })
      return
    }

    if (req.method === "GET" && url.pathname === "/api/config") {
      sendJson(res, 200, store.config)
      return
    }

    if (req.method === "GET" && url.pathname === "/api/products") {
      sendJson(res, 200, store.products)
      return
    }

    if (req.method === "PATCH" && url.pathname.startsWith("/api/products/")) {
      const productId = url.pathname.split("/").pop()
      const payload = await readJson(req)
      const product = store.products.find((item) => item.id === productId)
      if (!product) {
        notFound(res)
        return
      }
      if (typeof payload.stock === "number") {
        product.stock = Math.max(0, payload.stock)
      }
      writeStore(store)
      sendJson(res, 200, product)
      return
    }

    if (req.method === "GET" && url.pathname === "/api/orders") {
      sendJson(res, 200, store.orders)
      return
    }

    if (req.method === "POST" && url.pathname === "/api/orders") {
      const payload = await readJson(req)
      const order = applyOrder(store, payload)
      writeStore(store)
      sendJson(res, 201, order)
      return
    }

    if (req.method === "PATCH" && url.pathname.startsWith("/api/orders/")) {
      const orderId = url.pathname.split("/").pop()
      const payload = await readJson(req)
      const order = updateOrderStatus(store, orderId, payload.status || "待接单")
      writeStore(store)
      sendJson(res, 200, order)
      return
    }

    if (req.method === "GET" && url.pathname === "/api/member") {
      sendJson(res, 200, store.member)
      return
    }

    if (req.method === "GET" && url.pathname === "/api/dashboard") {
      sendJson(res, 200, buildDashboard(store))
      return
    }

    if (req.method === "POST" && url.pathname === "/api/reset-demo") {
      const nextStore = resetStore()
      sendJson(res, 200, { ok: true, store: nextStore })
      return
    }

    notFound(res)
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" })
  }
})

server.listen(port, () => {
  console.log(`Chuntime backend listening on http://127.0.0.1:${port}`)
})
