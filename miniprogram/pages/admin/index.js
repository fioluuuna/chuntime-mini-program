const {
  getDashboard,
  updateProductStock,
  updateMaterial,
  resetDemo,
  getOrders,
  updateOrderStatus,
  getMaterials,
  getLedger,
  addLedgerIncome,
  addLedgerExpense,
} = require("../../utils/api")
const { hasOwnerSession, clearOwnerSession } = require("../../utils/state")

const MATERIAL_GROUP_ORDER = ["packaging", "kitchen"]

function getTodayDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getOrderStatusText(status) {
  switch (status) {
    case "pending_payment":
      return "待付款"
    case "pending_confirm":
      return "待确认"
    case "completed":
      return "已完成"
    default:
      return "处理中"
  }
}

function getStatusClass(status) {
  switch (status) {
    case "pending_payment":
      return "pending-payment"
    case "pending_confirm":
      return "pending-confirm"
    case "completed":
      return "completed"
    case "warning":
      return "warning"
    case "normal":
    default:
      return "normal"
  }
}

function getFulfillmentText(type) {
  return type === "pickup" ? "自提" : "配送"
}

function mapMaterial(item) {
  return {
    ...item,
    statusClass: getStatusClass(item.statusKey),
  }
}

function mapOrder(item) {
  return {
    ...item,
    statusText: getOrderStatusText(item.status),
    statusClass: getStatusClass(item.status),
    fulfillmentText: getFulfillmentText(item.fulfillmentType),
  }
}

function groupMaterials(materials) {
  const buckets = {}
  materials.forEach((item) => {
    const key = item.groupKey || "other"
    if (!buckets[key]) {
      buckets[key] = {
        key,
        title: item.groupLabel || "其他物料",
        items: [],
      }
    }
    buckets[key].items.push(item)
  })

  return Object.values(buckets).sort((a, b) => {
    const aIndex = MATERIAL_GROUP_ORDER.indexOf(a.key)
    const bIndex = MATERIAL_GROUP_ORDER.indexOf(b.key)
    const safeA = aIndex === -1 ? 999 : aIndex
    const safeB = bIndex === -1 ? 999 : bIndex
    return safeA - safeB
  })
}

Page({
  data: {
    summaryCards: [],
    stocks: [],
    materials: [],
    materialGroups: [],
    materialAlerts: [],
    reportText: "",
    orders: [],
    visibleOrders: [],
    orderFilter: "all",
    activeModule: "orders",
    ledgerDate: getTodayDate(),
    ledger: {
      summary: {
        incomeText: "￥0.00",
        expenseText: "￥0.00",
        balanceText: "￥0.00",
      },
      incomeEntries: [],
      expenseEntries: [],
    },
    incomeSources: ["堂食收款码", "现金", "微信收款", "支付宝", "其他"],
    expenseCategories: ["食材采购", "调料", "包装耗材", "水电", "其他"],
    incomeSourceIndex: 0,
    expenseCategoryIndex: 0,
    incomeAmount: "",
    incomeRemark: "",
    expenseAmount: "",
    expenseRemark: "",
    analytics: {
      topSoups: [],
      topHours: [],
      topCustomers: [],
    },
  },

  async onShow() {
    if (!hasOwnerSession()) {
      wx.switchTab({ url: "/pages/home/index" })
      return
    }
    await this.refresh()
  },

  async refresh() {
    const ledgerDate = this.data.ledgerDate || getTodayDate()
    try {
      const [dashboard, orders, materials, ledger] = await Promise.all([
        getDashboard(),
        getOrders(),
        getMaterials(),
        getLedger(ledgerDate),
      ])
      const mappedMaterials = materials.map(mapMaterial)
      this.setData({
        summaryCards: dashboard.summaryCards,
        stocks: dashboard.stocks,
        materials: mappedMaterials,
        materialGroups: groupMaterials(mappedMaterials),
        materialAlerts: (dashboard.materialAlerts || []).map(mapMaterial),
        reportText: dashboard.reportText,
        analytics: dashboard.analytics || this.data.analytics,
        orders: orders.map(mapOrder),
        ledgerDate,
        ledger,
      })
      this.applyOrderFilter()
    } catch (error) {
      wx.showToast({ title: "后台数据加载失败", icon: "none" })
    }
  },

  applyOrderFilter() {
    const filter = this.data.orderFilter
    const visibleOrders = this.data.orders.filter((item) => {
      if (filter === "all") return true
      return item.status === filter
    })
    this.setData({ visibleOrders })
  },

  changeModule(e) {
    this.setData({ activeModule: e.currentTarget.dataset.module })
  },

  changeOrderFilter(e) {
    this.setData({ orderFilter: e.currentTarget.dataset.filter })
    this.applyOrderFilter()
  },

  copyReport() {
    wx.setClipboardData({
      data: this.data.reportText,
      success: () => wx.showToast({ title: "今日摘要已复制", icon: "success" }),
    })
  },

  async changeStock(e) {
    const { id, delta } = e.currentTarget.dataset
    const current = this.data.stocks.find((item) => item.id === id)
    if (!current) return
    const stock = Math.max(0, current.stock + Number(delta))
    try {
      await updateProductStock(id, stock)
      await this.refresh()
    } catch (error) {
      wx.showToast({ title: error.message || "修改失败", icon: "none" })
    }
  },

  async changeMaterialStock(e) {
    const { id, delta } = e.currentTarget.dataset
    const current = this.data.materials.find((item) => item.id === id)
    if (!current) return
    const stock = Math.max(0, current.stock + Number(delta))
    try {
      await updateMaterial(id, { stock })
      await this.refresh()
    } catch (error) {
      wx.showToast({ title: error.message || "修改失败", icon: "none" })
    }
  },

  async changeMaterialWarning(e) {
    const { id, delta } = e.currentTarget.dataset
    const current = this.data.materials.find((item) => item.id === id)
    if (!current) return
    const warningLine = Math.max(0, current.warningLine + Number(delta))
    try {
      await updateMaterial(id, { warningLine })
      await this.refresh()
    } catch (error) {
      wx.showToast({ title: error.message || "修改失败", icon: "none" })
    }
  },

  async stepOrder(e) {
    const { id, status } = e.currentTarget.dataset
    try {
      await updateOrderStatus(id, status)
      await this.refresh()
    } catch (error) {
      wx.showToast({ title: error.message || "更新失败", icon: "none" })
    }
  },

  changeLedgerDate(e) {
    this.setData({ ledgerDate: e.detail.value })
    this.loadLedger(e.detail.value)
  },

  async loadLedger(date) {
    try {
      const ledger = await getLedger(date)
      this.setData({ ledger })
    } catch (error) {
      wx.showToast({ title: "记账数据加载失败", icon: "none" })
    }
  },

  changeIncomeSource(e) {
    this.setData({ incomeSourceIndex: Number(e.detail.value || 0) })
  },

  changeExpenseCategory(e) {
    this.setData({ expenseCategoryIndex: Number(e.detail.value || 0) })
  },

  bindIncomeAmount(e) {
    this.setData({ incomeAmount: e.detail.value })
  },

  bindIncomeRemark(e) {
    this.setData({ incomeRemark: e.detail.value })
  },

  bindExpenseAmount(e) {
    this.setData({ expenseAmount: e.detail.value })
  },

  bindExpenseRemark(e) {
    this.setData({ expenseRemark: e.detail.value })
  },

  async submitIncome() {
    const amount = Number(this.data.incomeAmount)
    if (!amount || amount <= 0) {
      wx.showToast({ title: "请输入正确金额", icon: "none" })
      return
    }
    const source = this.data.incomeSources[this.data.incomeSourceIndex] || "其他"
    try {
      await addLedgerIncome({
        date: this.data.ledgerDate,
        amount,
        source,
        remark: this.data.incomeRemark.trim(),
      })
      this.setData({
        incomeAmount: "",
        incomeRemark: "",
      })
      await this.refresh()
      wx.showToast({ title: "收入已记录", icon: "success" })
    } catch (error) {
      wx.showToast({ title: error.message || "记录失败", icon: "none" })
    }
  },

  async submitExpense() {
    const amount = Number(this.data.expenseAmount)
    if (!amount || amount <= 0) {
      wx.showToast({ title: "请输入正确金额", icon: "none" })
      return
    }
    const category = this.data.expenseCategories[this.data.expenseCategoryIndex] || "其他"
    try {
      await addLedgerExpense({
        date: this.data.ledgerDate,
        amount,
        category,
        remark: this.data.expenseRemark.trim(),
      })
      this.setData({
        expenseAmount: "",
        expenseRemark: "",
      })
      await this.refresh()
      wx.showToast({ title: "支出已记录", icon: "success" })
    } catch (error) {
      wx.showToast({ title: error.message || "记录失败", icon: "none" })
    }
  },

  async resetDemoData() {
    try {
      await resetDemo()
      this.setData({
        ledgerDate: getTodayDate(),
        incomeAmount: "",
        incomeRemark: "",
        expenseAmount: "",
        expenseRemark: "",
        incomeSourceIndex: 0,
        expenseCategoryIndex: 0,
      })
      await this.refresh()
      wx.showToast({ title: "演示数据已重置", icon: "success" })
    } catch (error) {
      wx.showToast({ title: "重置失败", icon: "none" })
    }
  },

  logout() {
    clearOwnerSession()
    wx.switchTab({ url: "/pages/home/index" })
  },
})
