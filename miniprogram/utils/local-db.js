const catalog = require("../data/catalog")

const KEY = "ct_local_store"
const SCHEMA_VERSION = 3

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100
}

function formatMoney(value) {
  return `￥${round2(value).toFixed(2)}`
}

function pad2(value) {
  return String(value).padStart(2, "0")
}

function formatDateKey(input) {
  if (!input) {
    return ""
  }
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input
  }
  const raw = typeof input === "string" ? input.replace(/\//g, "-") : ""
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(raw)) {
    const [year, month, day] = raw.split("-")
    return `${year}-${pad2(month)}-${pad2(day)}`
  }
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function getTodayDateKey() {
  return formatDateKey(new Date())
}

function formatTimestamp(date = new Date()) {
  return `${formatDateKey(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

function buildDefaultMaterials() {
  return [
    {
      id: "material-box",
      name: "炖汤打包盒",
      groupKey: "packaging",
      groupLabel: "包材耗材",
      stock: 7,
      warningLine: 10,
      unit: "个",
    },
    {
      id: "material-bag",
      name: "打包袋",
      groupKey: "packaging",
      groupLabel: "包材耗材",
      stock: 26,
      warningLine: 10,
      unit: "个",
    },
    {
      id: "material-cutlery",
      name: "餐具",
      groupKey: "packaging",
      groupLabel: "包材耗材",
      stock: 40,
      warningLine: 15,
      unit: "份",
    },
    {
      id: "material-noodle-stock",
      name: "面条",
      groupKey: "kitchen",
      groupLabel: "厨房食材/辅料",
      stock: 18,
      warningLine: 6,
      unit: "份",
    },
    {
      id: "material-flour",
      name: "面粉",
      groupKey: "kitchen",
      groupLabel: "厨房食材/辅料",
      stock: 4,
      warningLine: 2,
      unit: "袋",
    },
    {
      id: "material-salt",
      name: "盐",
      groupKey: "kitchen",
      groupLabel: "厨房食材/辅料",
      stock: 5,
      warningLine: 2,
      unit: "袋",
    },
    {
      id: "material-sugar",
      name: "糖",
      groupKey: "kitchen",
      groupLabel: "厨房食材/辅料",
      stock: 4,
      warningLine: 2,
      unit: "袋",
    },
    {
      id: "material-oil",
      name: "油",
      groupKey: "kitchen",
      groupLabel: "厨房食材/辅料",
      stock: 3,
      warningLine: 1,
      unit: "桶",
    },
    {
      id: "material-seasoning",
      name: "调味品",
      groupKey: "kitchen",
      groupLabel: "厨房食材/辅料",
      stock: 6,
      warningLine: 2,
      unit: "瓶",
    },
  ]
}

function buildDefaultLedger() {
  return {
    "2026-06-26": {
      income: [
        {
          id: "income-20260626-1",
          amount: 168,
          source: "微信收款",
          remark: "午市外卖订单",
          createdAt: "2026-06-26 12:08:00",
        },
        {
          id: "income-20260626-2",
          amount: 56,
          source: "堂食收款码",
          remark: "到店自提",
          createdAt: "2026-06-26 18:16:00",
        },
      ],
      expense: [
        {
          id: "expense-20260626-1",
          amount: 86,
          category: "食材采购",
          remark: "早市补货",
          createdAt: "2026-06-26 08:05:00",
        },
        {
          id: "expense-20260626-2",
          amount: 18,
          category: "包装耗材",
          remark: "餐具补货",
          createdAt: "2026-06-26 15:12:00",
        },
      ],
    },
    "2026-06-25": {
      income: [
        {
          id: "income-20260625-1",
          amount: 198,
          source: "微信收款",
          remark: "午高峰订单",
          createdAt: "2026-06-25 13:02:00",
        },
      ],
      expense: [
        {
          id: "expense-20260625-1",
          amount: 112,
          category: "食材采购",
          remark: "汤料与蔬菜",
          createdAt: "2026-06-25 07:36:00",
        },
        {
          id: "expense-20260625-2",
          amount: 24,
          category: "其他",
          remark: "临时配送油费",
          createdAt: "2026-06-25 17:40:00",
        },
      ],
    },
  }
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
      baseStock: item.baseStock || item.stock,
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
    schemaVersion: SCHEMA_VERSION,
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
      paymentQrImage: catalog.images.paymentQr,
      paymentTips: "请使用店长个人微信收款码付款，付款后再点击“我已付款”，店长会手动确认。",
      ownerAccessCode: "dsg2026",
    },
    products,
    materials: buildDefaultMaterials(),
    ledger: buildDefaultLedger(),
    member: {
      points: 1260,
      balance: 300,
      membership: "金卡会员",
      orderCount: 3,
      lastOrderAt: "2026/06/25 18:20:00",
      coupons: [
        { id: "coupon-88-1", title: "88 折券", desc: "全单可用", type: "discount" },
        { id: "coupon-88-2", title: "88 折券", desc: "全单可用", type: "discount" },
        { id: "coupon-soup-1", title: "炖汤兑换券", desc: "300 积分可兑换指定炖汤", type: "gift" },
      ],
    },
    orders: [
      {
        id: "CTA103",
        name: "陈小姐",
        phone: "13800000001",
        fulfillmentType: "delivery",
        address: "金山谷",
        remark: "",
        items: [
          { productId: "soup-02", productName: "五指毛桃茯苓龙骨汤", quantity: 1, price: 15.84, originalPrice: 18 },
          { productId: "noodle-01", productName: "葱油菠菜面", quantity: 1, price: 8.71, originalPrice: 9.9 },
        ],
        totals: { subtotal: 27.9, discountedSubtotal: 24.55, shipping: 3, savings: 3.35, total: 27.55 },
        status: "pending_confirm",
        createdAt: "2026/06/25 10:32:00",
      },
      {
        id: "CTA104",
        name: "李先生",
        phone: "13800000002",
        fulfillmentType: "pickup",
        address: "到店自取",
        remark: "12 点后到店",
        items: [{ productId: "soup-07", productName: "红萝卜汤", quantity: 2, price: 13.2, originalPrice: 15 }],
        totals: { subtotal: 30, discountedSubtotal: 26.4, shipping: 0, savings: 3.6, total: 26.4 },
        status: "completed",
        createdAt: "2026/06/24 18:06:00",
      },
      {
        id: "CTA105",
        name: "王女士",
        phone: "13800000003",
        fulfillmentType: "delivery",
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
        status: "pending_payment",
        createdAt: "2026/06/25 11:08:00",
      },
    ],
  }
}

function getPublicConfig(config) {
  return {
    name: config.shopName,
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
  if (!current || Number(current.schemaVersion || 0) < SCHEMA_VERSION) {
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
  return `${pad2(hour)}:00-${pad2(hour + 1)}:00`
}

function getMaterialStatusKey(item) {
  return Number(item.stock || 0) <= Number(item.warningLine || 0) ? "warning" : "normal"
}

function getMaterialStatusText(statusKey) {
  return statusKey === "warning" ? "需补货" : "正常"
}

function enrichMaterial(item) {
  const statusKey = getMaterialStatusKey(item)
  return {
    ...item,
    statusKey,
    statusText: getMaterialStatusText(statusKey),
  }
}

function ensureLedgerDay(store, dateKey) {
  if (!store.ledger) {
    store.ledger = {}
  }
  if (!store.ledger[dateKey]) {
    store.ledger[dateKey] = {
      income: [],
      expense: [],
    }
  }
  return store.ledger[dateKey]
}

function buildLedgerSnapshot(day, dateKey) {
  const incomeEntries = clone(day?.income || []).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const expenseEntries = clone(day?.expense || []).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const incomeTotal = round2(incomeEntries.reduce((sum, item) => sum + Number(item.amount || 0), 0))
  const expenseTotal = round2(expenseEntries.reduce((sum, item) => sum + Number(item.amount || 0), 0))
  const balance = round2(incomeTotal - expenseTotal)

  return {
    date: dateKey,
    summary: {
      incomeTotal,
      expenseTotal,
      balance,
      incomeText: formatMoney(incomeTotal),
      expenseText: formatMoney(expenseTotal),
      balanceText: formatMoney(balance),
    },
    incomeEntries,
    expenseEntries,
  }
}

function buildDashboard(store) {
  const totalRevenue = round2(store.orders.reduce((sum, order) => sum + Number(order.totals?.total || 0), 0))
  const pendingCount = store.orders.filter((order) => order.status !== "completed").length
  const stockCards = store.products.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    stock: item.stock,
    remaining: item.stock,
  }))
  const materialCards = (store.materials || []).map(enrichMaterial)
  const materialAlerts = materialCards.filter((item) => item.statusKey === "warning")

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

  const todayLedger = buildLedgerSnapshot(ensureLedgerDay(store, getTodayDateKey()), getTodayDateKey())

  return {
    summaryCards: [
      { label: "累计订单", value: store.orders.length },
      { label: "累计销售额", value: formatMoney(totalRevenue) },
      { label: "待处理订单", value: pendingCount },
      { label: "物料预警", value: materialAlerts.length },
    ],
    stocks: stockCards,
    materials: materialCards,
    materialAlerts,
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
          amount: formatMoney(item.amount),
        })),
    },
    ledgerOverview: todayLedger.summary,
    reportText: `今日记账结余 ${todayLedger.summary.balanceText}，收入 ${todayLedger.summary.incomeText}，支出 ${todayLedger.summary.expenseText}。先看待确认订单，再看库存和物料预警。`,
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

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const hasSoup = items.some(
    (item) => String(item.productId).startsWith("soup-") || item.parts?.some((part) => String(part.productId).startsWith("soup-"))
  )

  const materials = store.materials || []
  if (hasSoup) {
    const box = materials.find((item) => item.id === "material-box")
    if (box) {
      box.stock = Math.max(0, box.stock - totalQuantity)
    }
  }

  const bag = materials.find((item) => item.id === "material-bag")
  if (bag && payload.fulfillmentType === "delivery") {
    bag.stock = Math.max(0, bag.stock - 1)
  }

  const cutlery = materials.find((item) => item.id === "material-cutlery")
  if (cutlery) {
    cutlery.stock = Math.max(0, cutlery.stock - totalQuantity)
  }

  const order = {
    id: `CT${Date.now()}`,
    name: payload.customerName || "顾客",
    phone: payload.phone || "",
    fulfillmentType: payload.fulfillmentType || "delivery",
    address: payload.address || "",
    remark: payload.remark || "",
    items,
    totals: payload.totals || {},
    status: "pending_payment",
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
    return Promise.reject(new Error("店长密码不正确"))
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

function getMaterials() {
  return Promise.resolve((readStore().materials || []).map(enrichMaterial))
}

function updateMaterial(materialId, payload = {}) {
  const store = readStore()
  const material = (store.materials || []).find((item) => item.id === materialId)
  if (!material) {
    return Promise.reject(new Error("物料不存在"))
  }
  if (typeof payload.stock === "number") {
    material.stock = Math.max(0, payload.stock)
  }
  if (typeof payload.warningLine === "number") {
    material.warningLine = Math.max(0, payload.warningLine)
  }
  writeStore(store)
  return Promise.resolve(enrichMaterial(material))
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
  if (status === "completed" && previousStatus !== "completed") {
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
  return updateOrderStatus(orderId, "pending_confirm")
}

function getMember() {
  return Promise.resolve(readStore().member)
}

function getDashboard() {
  const store = readStore()
  return Promise.resolve(buildDashboard(store))
}

function getLedger(date) {
  const store = readStore()
  const dateKey = formatDateKey(date) || getTodayDateKey()
  const day = ensureLedgerDay(store, dateKey)
  writeStore(store)
  return Promise.resolve(buildLedgerSnapshot(day, dateKey))
}

function addLedgerEntry(type, payload = {}) {
  const normalizedType = type === "expense" ? "expense" : "income"
  const amount = round2(payload.amount)
  if (!amount || amount <= 0) {
    return Promise.reject(new Error("请输入正确金额"))
  }
  const dateKey = formatDateKey(payload.date) || getTodayDateKey()
  const store = readStore()
  const day = ensureLedgerDay(store, dateKey)
  const entry = {
    id: `${normalizedType}-${Date.now()}`,
    amount,
    remark: String(payload.remark || "").trim(),
    createdAt: formatTimestamp(new Date()),
  }

  if (normalizedType === "income") {
    entry.source = String(payload.source || "").trim() || "其他"
    day.income.unshift(entry)
  } else {
    entry.category = String(payload.category || "").trim() || "其他"
    day.expense.unshift(entry)
  }

  writeStore(store)
  return Promise.resolve(buildLedgerSnapshot(day, dateKey))
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
  getMaterials,
  updateMaterial,
  getSupplies: getMaterials,
  updateSupply: updateMaterial,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  markOrderPaid,
  getMember,
  getDashboard,
  getLedger,
  addLedgerIncome(payload) {
    return addLedgerEntry("income", payload)
  },
  addLedgerExpense(payload) {
    return addLedgerEntry("expense", payload)
  },
}
