const {
  getDashboard,
  updateProductStock,
  updateSupply,
  resetDemo,
  getOrders,
  updateOrderStatus,
  getSupplies
} = require("../../utils/api")
const { hasOwnerSession, clearOwnerSession } = require("../../utils/state")

function getStatusClass(status) {
  switch (status) {
    case "待付款":
      return "pending-payment"
    case "待确认":
      return "pending-confirm"
    case "已完成":
      return "completed"
    case "需补货":
      return "warning"
    case "正常":
    default:
      return "normal"
  }
}

function mapSupply(item) {
  return {
    ...item,
    statusClass: getStatusClass(item.status),
  }
}

function mapOrder(item) {
  return {
    ...item,
    statusClass: getStatusClass(item.status),
  }
}

Page({
  data: {
    summaryCards: [],
    stocks: [],
    supplies: [],
    supplyAlerts: [],
    reportText: "",
    orders: [],
    visibleOrders: [],
    orderFilter: "全部",
    activeModule: "orders",
    analytics: {
      topSoups: [],
      topHours: [],
      topCustomers: [],
    }
  },

  async onShow() {
    if (!hasOwnerSession()) {
      wx.redirectTo({ url: "/pages/owner-login/index" })
      return
    }
    await this.refresh()
  },

  async refresh() {
    try {
      const [dashboard, orders, supplies] = await Promise.all([getDashboard(), getOrders(), getSupplies()])
      this.setData({
        summaryCards: dashboard.summaryCards,
        stocks: dashboard.stocks,
        supplies: supplies.map(mapSupply),
        supplyAlerts: (dashboard.supplyAlerts || []).map(mapSupply),
        reportText: dashboard.reportText,
        analytics: dashboard.analytics || this.data.analytics,
        orders: orders.map(mapOrder)
      })
      this.applyOrderFilter()
    } catch (error) {
      wx.showToast({ title: "后台数据加载失败", icon: "none" })
    }
  },

  applyOrderFilter() {
    const filter = this.data.orderFilter
    const visibleOrders = this.data.orders.filter((item) => {
      if (filter === "全部") return true
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
      success: () => wx.showToast({ title: "已复制", icon: "success" })
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

  async changeSupplyStock(e) {
    const { id, delta } = e.currentTarget.dataset
    const current = this.data.supplies.find((item) => item.id === id)
    if (!current) return
    const stock = Math.max(0, current.stock + Number(delta))
    try {
      await updateSupply(id, { stock })
      await this.refresh()
    } catch (error) {
      wx.showToast({ title: error.message || "修改失败", icon: "none" })
    }
  },

  async changeSupplyWarning(e) {
    const { id, delta } = e.currentTarget.dataset
    const current = this.data.supplies.find((item) => item.id === id)
    if (!current) return
    const warningLine = Math.max(0, current.warningLine + Number(delta))
    try {
      await updateSupply(id, { warningLine })
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

  async resetDemoData() {
    try {
      await resetDemo()
      await this.refresh()
      wx.showToast({ title: "演示数据已重置", icon: "success" })
    } catch (error) {
      wx.showToast({ title: "重置失败", icon: "none" })
    }
  },

  logout() {
    clearOwnerSession()
    wx.redirectTo({ url: "/pages/owner-login/index" })
  }
})
