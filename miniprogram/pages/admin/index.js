const { getDashboard, updateProductStock, resetDemo } = require("../../utils/api")

Page({
  data: {
    summaryCards: [],
    stocks: [],
    reportText: ""
  },

  async onShow() {
    await this.refresh()
  },

  async refresh() {
    try {
      const dashboard = await getDashboard()
      this.setData({
        summaryCards: dashboard.summaryCards,
        stocks: dashboard.stocks,
        reportText: dashboard.reportText
      })
    } catch (error) {
      wx.showToast({ title: "后端未连接，后台数据不可用", icon: "none" })
    }
  },

  copyReport() {
    wx.setClipboardData({
      data: this.data.reportText,
      success: () => {
        wx.showToast({ title: "已复制", icon: "success" })
      }
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

  async resetDemoData() {
    try {
      await resetDemo()
      await this.refresh()
      wx.showToast({ title: "演示数据已重置", icon: "success" })
    } catch (error) {
      wx.showToast({ title: "重置失败", icon: "none" })
    }
  }
})

