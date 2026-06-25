const catalog = require("../data/catalog")

const KEY = "ct_local_store"

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function round2(value) {
  return Math.round(value * 100) / 100
}

function buildDefaultStore() {
  const products = [
    ...catalog.soups.map((item) => ({
      id: item.id,
      category: "soup",
      name: item.name,
      price: item.price,
      image: item.image,
      desc: item.desc,
      stock: item.stock,
    })),
    ...catalog.noodles.map((item) => ({
      id: item.id,
      category: "noodle",
      name: item.name,
      price: item.price,
      image: item.image,
      desc: item.desc,
      stock: item.stock || 20,
    })),
  ]

  return {
    config: {
      shopName: catalog.shop.name,
      address: catalog.shop.address,
      phone: catalog.shop.phone,
      hours: catalog.shop.hours,
      deliveryAreas: catalog.shop.deliveryAreas,
      deliveryFee: catalog.shop.deliveryFee,
      discountRate: catalog.shop.discountRate,
      openingDiscountText: catalog.shop.openingDiscountText,
      saleMode: "preorder",
      paymentQrImage: "/assets/images/owner-qr.png",
      paymentTips: "当前测试页先使用店长二维码占位。正式营业前，请替换成店长个人收款码图片；顾客转账后再点击“我已付款”。",
      ownerAccessCode: "888888",
    },
    products,
    supplies: [
      { id: "supply-box", name: "炖汤打包盒", stock: 7, warningLine: 10, unit: "个" },
      { id: "supply-bag", name: "打包袋", stock: 26, warningLine: 10, unit: "个" },
      { id: "supply-cutlery", name: "餐具", stock: 40, warningLine: 15, unit: "份" },
    ],
    member: {
      points: 1260,
      balance: 300,
      membership: "金卡会员",
      orderCount: 3,
      lastOrderAt: "2026/06/25 18:20:00",
      coupons: [
        { id: "coupon-88-1", title: "88折券", desc: "全单使用", type: "discount" },
        { id: "coupon-88-2", title: "88折券", desc: "全单使用", type: "discount" },
        { id: "coupon-soup-1", title: "炖汤兑换券", desc: "300积分可兑指定炖汤", type: "gift" },
      ],
    },
    orders: [
      {
        id: "CTA103",
        name: "陈小姐",
        phone: "13800000001",
        fulfillmentType: "配送",
        address: "金山谷",
        remark: "",
        items: [
          { productId: "soup-02", productName: "五指毛桃茯苓龙骨汤", quantity: 1, price: 15.84, originalPrice: 18 },
          { productId: "noodle-01", productName: "葱油菠菜面", quantity: 1, price: 8.71, originalPrice: 9.9 },
        ],
        totals: { subtotal: 27.9, discountedSubtotal: 24.55, shipping: 3, savings: 3.35, total: 27.55 },
        status: "待确认",
        createdAt: "2026/06/25 10:32:00",
      },
      {
        id: "CTA104",
        name: "李先生",
        phone: "13800000002",
        fulfillmentType: "自提",
        address: "到店自取",
        remark: "12点后到店",
        items: [
          { productId: "soup-07", productName: "红萝卜汤", quantity: 2, price: 13.2, originalPrice: 15 },
        ],
        totals: { subtotal: 30, discountedSubtotal: 26.4, shipping: 0, savings: 3.6, total: 26.4 },
        status: "已完成",
        createdAt: "2026/06/24 18:06:00",
      },
      {
        id: "CTA105",
        name: "王女士",
        phone: "13800000003",
        fulfillmentType: "配送",
        address: "意库",
        remark: "",
        items: [
          {
            productId: "combo:soup-03:noodle-02",
            productName: "黄精虫草花土鸡汤 + 肉酱菠菜面",
            quantity: 1,
            price: 27.19,
            originalPrice: 30.9,
            parts: [
              { productId: "soup-03", productName: "黄精虫草花土鸡汤", quantity: 1, originalPrice: 18 },
              { productId: "noodle-02", productName: "肉酱菠菜面", quantity: 1, originalPrice: 12.9 },
            ],
          },
        ],
        totals: { subtotal: 30.9, discountedSubtotal: 27.19, shipping: 3, savings: 3.71, total: 30.19 },
        status: "待付款",
        createdAt: "2026/06/25 11:08:00",
      },
    ],
  }
}

function getPublicConfig(config) {
  return {
    shopName: config.shopName,
    address: config.address,
    phone: config.phone,
    hours: config.hours,
    deliveryAreas: config.deliveryAreas,
    deliveryFee: config.deliveryFee,
    discountRate: config.discountRate,
    openingDiscountText: config.openingDiscountText,
    saleMode: config.saleMode,
    paymentQrImage: config.paymentQrImage,
    paymentTips: config.paymentTips,
  }
}

function ensureStore() {
  const current = wx.getStorageSync(KEY)
  if (!current) {
    wx.setStorageSync(KEY, buildDefaultStore())
  }
}

function readStore() {
  ensureStore()
  return clone(wx.getStorageSync(KEY))
}

function writeStore(nextStore) {
  wx.setStorageSync(KEY, clone(nextStore))
  return clone(nextStore)
}

function resetStore() {
  const nextStore = buildDefaultStore()
  writeStore(nextStore)
  return nextStore
}

function parseHourLabel(createdAt) {
  const match = String(createdAt || "").match(/(\d{1,2}):\d{2}/)
  if (!match) {
    return "未知时段"
  }
  const hour = Number(match[1])
  return `${String(hour).padStart(2, "0")}:00-${String(hour + 1).padStart(2, "0")}:00`
}

function getSupplyStatus(item) {
  return item.stock <= item.warningLine ? "需补货" : "正常"
}

function buildDashboard(store) {
  const totalRevenue = store.orders.reduce((sum, order) => sum + Number(order.totals?.total || 0), 0)
  const pendingCount = store.orders.filter((order) => order.status !== "已完成").length
  const stockCards = store.products.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    stock: item.stock,
    remaining: item.stock,
  }))
  const supplyCards = store.supplies.map((item) => ({
    ...item,
    status: getSupplyStatus(item),
  }))
  const supplyAlerts = supplyCards.filter((item) => item.status === "需补货")

  const soupMap = {}
  const hourMap = {}
  const customerMap = {}

  for (const order of store.orders) {
    hourMap[parseHourLabel(order.createdAt)] = (hourMap[parseHourLabel(order.createdAt)] || 0) + 1
    customerMap[order.phone || order.name] = customerMap[order.phone || order.name] || {
      name: order.name || "顾客",
      phone: order.phone || "",
      count: 0,
      amount: 0,
    }
    customerMap[order.phone || order.name].count += 1
    customerMap[order.phone || order.name].amount += Number(order.totals?.total || 0)

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
      { label: "累计销售额", value: `¥${round2(totalRevenue).toFixed(2)}` },
      { label: "待处理订单", value: pendingCount },
      { label: "耗材预警", value: supplyAlerts.length },
    ],
    stocks: stockCards,
    supplies: supplyCards,
    supplyAlerts,
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
          amount: `¥${round2(item.amount).toFixed(2)}`,
        })),
    },
    reportText: "先看待确认订单，再看炖汤库存和耗材预警。当前后台以手机可操作为主，不做复杂导出。",
  }
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
        if (!product || product.stock < part.quantity * item.quantity) {
          throw new Error(`${part.productName} 库存不足`)
        }
      }
      continue
    }

    const product = store.products.find((entry) => entry.id === item.productId)
    if (product && product.stock < item.quantity) {
      throw new Error(`${item.productName} 库存不足`)
    }
  }

  for (const item of items) {
    if (item.parts?.length) {
      for (const part of item.parts) {
        const product = store.products.find((entry) => entry.id === part.productId)
        product.stock -= part.quantity * item.quantity
      }
      continue
    }

    const product = store.products.find((entry) => entry.id === item.productId)
    if (product) {
      product.stock -= item.quantity
    }
  }

  if (items.some((item) => String(item.productId).startsWith("soup-") || item.parts?.some((part) => String(part.productId).startsWith("soup-")))) {
    const box = store.supplies.find((item) => item.id === "supply-box")
    if (box) {
      box.stock = Math.max(0, box.stock - items.reduce((sum, item) => sum + item.quantity, 0))
    }
  }

  const bag = store.supplies.find((item) => item.id === "supply-bag")
  if (bag && payload.fulfillmentType === "配送") {
    bag.stock = Math.max(0, bag.stock - 1)
  }

  const cutlery = store.supplies.find((item) => item.id === "supply-cutlery")
  if (cutlery) {
    cutlery.stock = Math.max(0, cutlery.stock - items.reduce((sum, item) => sum + item.quantity, 0))
  }

  const order = {
    id: `CT${Date.now()}`,
    name: payload.customerName || "顾客",
    phone: payload.phone || "",
    fulfillmentType: payload.fulfillmentType || "配送",
    address: payload.address || "",
    remark: payload.remark || "",
    items,
    totals: payload.totals || {},
    status: "待付款",
    createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
  }

  store.orders.unshift(order)
  return order
}

function getConfig() {
  return Promise.resolve(getPublicConfig(readStore().config))
}

function ownerLogin(code) {
  const store = readStore()
  if (String(code || "") !== String(store.config.ownerAccessCode || "")) {
    return Promise.reject(new Error("店长口令不正确"))
  }
  return Promise.resolve({ ok: true })
}

function getProducts() {
  return Promise.resolve(readStore().products)
}

function updateProductStock(productId, stock) {
  const store = readStore()
  const product = store.products.find((item) => item.id === productId)
  if (!product) {
    return Promise.reject(new Error("商品不存在"))
  }
  product.stock = Math.max(0, Number(stock || 0))
  writeStore(store)
  return Promise.resolve(product)
}

function getSupplies() {
  const store = readStore()
  return Promise.resolve(store.supplies.map((item) => ({ ...item, status: getSupplyStatus(item) })))
}

function updateSupply(supplyId, payload = {}) {
  const store = readStore()
  const supply = store.supplies.find((item) => item.id === supplyId)
  if (!supply) {
    return Promise.reject(new Error("耗材不存在"))
  }
  if (typeof payload.stock === "number") {
    supply.stock = Math.max(0, payload.stock)
  }
  if (typeof payload.warningLine === "number") {
    supply.warningLine = Math.max(0, payload.warningLine)
  }
  writeStore(store)
  return Promise.resolve({ ...supply, status: getSupplyStatus(supply) })
}

function getOrders() {
  return Promise.resolve(readStore().orders)
}

function getOrderById(orderId) {
  const order = readStore().orders.find((item) => item.id === orderId)
  if (!order) {
    return Promise.reject(new Error("订单不存在"))
  }
  return Promise.resolve(order)
}

function createOrder(payload) {
  const store = readStore()
  const order = applyOrder(store, payload)
  writeStore(store)
  return Promise.resolve(order)
}

function updateOrderStatus(orderId, status) {
  const store = readStore()
  const order = store.orders.find((item) => item.id === orderId)
  if (!order) {
    return Promise.reject(new Error("订单不存在"))
  }
  const previousStatus = order.status
  order.status = status
  if (status === "已完成" && previousStatus !== "已完成") {
    store.member.points += Math.floor(Number(order.totals?.total || 0))
    store.member.orderCount += 1
    store.member.lastOrderAt = order.createdAt
    if (store.member.orderCount >= 10) {
      store.member.membership = "金卡会员"
    } else if (store.member.orderCount >= 5) {
      store.member.membership = "银卡会员"
    }
  }
  writeStore(store)
  return Promise.resolve(order)
}

function markOrderPaid(orderId) {
  return updateOrderStatus(orderId, "待确认")
}

function getMember() {
  return Promise.resolve(readStore().member)
}

function getDashboard() {
  return Promise.resolve(buildDashboard(readStore()))
}

module.exports = {
  KEY,
  buildDefaultStore,
  readStore,
  writeStore,
  resetStore,
  getConfig,
  ownerLogin,
  getProducts,
  updateProductStock,
  getSupplies,
  updateSupply,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  markOrderPaid,
  getMember,
  getDashboard,
}
