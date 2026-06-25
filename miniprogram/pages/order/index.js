const { catalog, toPriceText } = require("../../utils/pricing")
const { getOrders, createOrder, getConfig, getServiceMode } = require("../../utils/api")
const {
  ensureState,
  getCart,
  updateCartQuantity,
  clearCart,
  calculateCartTotals,
  getOwnedOrderIds,
  addOwnedOrderId
} = require("../../utils/state")

Page({
  data: {
    shop: catalog.shop,
    serviceMode: "remote",
    cart: [],
    myOrders: [],
    areaOptions: ["金山谷", "保利", "意库"],
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
    const [config, orders] = await Promise.all([getConfig(), getOrders()])
    const ownedIds = getOwnedOrderIds()
    this.setData({
      shop: { ...this.data.shop, ...config },
      myOrders: orders.filter((item) => ownedIds.includes(item.id)),
      serviceMode: getServiceMode(),
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
    const fulfillmentType = e.detail.value
    this.setData({
      fulfillmentType,
      address: fulfillmentType === "自提" ? "到店自取" : this.data.address === "到店自取" ? "意库" : this.data.address
    })
    this.refreshCart()
  },

  bindInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  chooseArea(e) {
    this.setData({ address: e.currentTarget.dataset.area })
  },

  goMenu() {
    wx.switchTab({ url: "/pages/menu/index" })
  },

  goPayment(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/payment/index?orderId=${orderId}` })
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
      const order = await createOrder({
        customerName: this.data.customerName,
        phone: this.data.phone,
        fulfillmentType: this.data.fulfillmentType,
        address: this.data.address,
        remark: this.data.remark,
        items: this.data.cart,
        totals: this.data.totals
      })
      addOwnedOrderId(order.id)
      clearCart()
      wx.navigateTo({ url: `/pages/payment/index?orderId=${order.id}` })
      this.setData({ remark: "" })
      this.refreshCart()
    } catch (error) {
      wx.showToast({ title: error.message || "下单失败", icon: "none" })
    }
  }
})
