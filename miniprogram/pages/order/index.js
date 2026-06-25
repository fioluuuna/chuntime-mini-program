const { catalog, toPriceText } = require("../../utils/pricing")
const { getOrders, createOrder, getConfig } = require("../../utils/api")
const { ensureState, getCart, updateCartQuantity, clearCart, calculateCartTotals } = require("../../utils/state")

Page({
  data: {
    shop: catalog.shop,
    cart: [],
    orders: [],
    fulfillmentType: "配送",
    customerName: "顾客",
    phone: "",
    address: "意库",
    remark: "",
    totals: {
      subtotal: 0,
      discountedSubtotal: 0,
      shipping: 0,
      total: 0,
      savings: 0
    }
  },

  async onShow() {
    ensureState()
    let config = this.data.shop
    let orders = []
    try {
      ;[config, orders] = await Promise.all([getConfig(), getOrders()])
    } catch (error) {
      wx.showToast({ title: "后端未连接，订单提交不可用", icon: "none" })
    }
    this.setData({
      shop: { ...this.data.shop, ...config },
      orders
    })
    this.refreshCart()
  },

  refreshCart() {
    const cart = getCart()
    const totals = calculateCartTotals(cart, this.data.shop.discountRate, this.data.shop.deliveryFee, this.data.fulfillmentType)
    this.setData({
      cart,
      totals: {
        subtotalText: toPriceText(totals.subtotal),
        discountedSubtotalText: toPriceText(totals.discountedSubtotal),
        shippingText: toPriceText(totals.shipping),
        totalText: toPriceText(totals.total),
        savingsText: toPriceText(totals.savings),
        ...totals
      }
    })
  },

  plusItem(e) {
    updateCartQuantity(e.currentTarget.dataset.id, 1)
    this.refreshCart()
  },

  minusItem(e) {
    updateCartQuantity(e.currentTarget.dataset.id, -1)
    this.refreshCart()
  },

  changeFulfillment(e) {
    this.setData({ fulfillmentType: e.detail.value })
    this.refreshCart()
  },

  bindInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  async submitOrder() {
    if (!this.data.cart.length) {
      wx.showToast({ title: "购物车还是空的", icon: "none" })
      return
    }
    if (!this.data.phone) {
      wx.showToast({ title: "请先填写手机号", icon: "none" })
      return
    }
    try {
      await createOrder({
        customerName: this.data.customerName,
        phone: this.data.phone,
        fulfillmentType: this.data.fulfillmentType,
        address: this.data.address,
        remark: this.data.remark,
        items: this.data.cart,
        totals: this.data.totals
      })
      clearCart()
      wx.showToast({ title: "下单成功", icon: "success" })
      const orders = await getOrders()
      this.setData({ orders, remark: "" })
      this.refreshCart()
    } catch (error) {
      wx.showToast({ title: error.message || "下单失败", icon: "none" })
    }
  }
})

