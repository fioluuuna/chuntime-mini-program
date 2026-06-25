const { getOrderById, getConfig, markOrderPaid } = require("../../utils/api")

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

Page({
  data: {
    shop: {},
    order: null,
    loading: true,
    statusText: "",
  },

  async onLoad(query) {
    this.orderId = query.orderId || ""
    await this.refresh()
  },

  async refresh() {
    if (!this.orderId) {
      wx.showToast({ title: "订单不存在", icon: "none" })
      return
    }
    try {
      const [shop, order] = await Promise.all([getConfig(), getOrderById(this.orderId)])
      this.setData({
        shop,
        order,
        statusText: getOrderStatusText(order.status),
        loading: false,
      })
    } catch (error) {
      wx.showToast({ title: error.message || "加载失败", icon: "none" })
    }
  },

  previewQr() {
    if (!this.data.shop.paymentQrImage) return
    wx.previewImage({
      current: this.data.shop.paymentQrImage,
      urls: [this.data.shop.paymentQrImage],
    })
  },

  async confirmPaid() {
    if (!this.data.order || this.data.order.status !== "pending_payment") {
      wx.showToast({ title: "当前状态无需重复提交", icon: "none" })
      return
    }
    try {
      await markOrderPaid(this.data.order.id)
      wx.showToast({ title: "已通知店长确认", icon: "success" })
      await this.refresh()
    } catch (error) {
      wx.showToast({ title: error.message || "提交失败", icon: "none" })
    }
  },

  goOrders() {
    wx.switchTab({ url: "/pages/order/index" })
  },
})
