const { catalog, toPriceText } = require("../../utils/pricing")
const { getOrders, createOrder, getConfig } = require("../../utils/api")
const {
  ensureState,
  getCart,
  updateCartQuantity,
  clearCart,
  calculateCartTotals,
  getOwnedOrderIds,
  addOwnedOrderId,
  getCustomerId,
  getCustomerProfile,
  saveCustomerProfile,
} = require("../../utils/state")

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

function getFulfillmentText(type) {
  return type === "pickup" ? "自提" : "配送"
}

function mapMyOrder(item) {
  return {
    ...item,
    statusText: getOrderStatusText(item.status),
    fulfillmentText: getFulfillmentText(item.fulfillmentType),
  }
}

Page({
  data: {
    shop: catalog.shop,
    cart: [],
    myOrders: [],
    areaOptions: ["金山谷", "保利", "意库"],
    fulfillmentType: "delivery",
    customerName: "",
    phone: "",
    address: "意库",
    remark: "",
    customerProfileId: "",
    rememberHint: "",
    totals: {
      subtotal: 0,
      discountedSubtotal: 0,
      shipping: 0,
      total: 0,
      savings: 0,
      subtotalText: "0.00",
      discountedSubtotalText: "0.00",
      shippingText: "0.00",
      totalText: "0.00",
      savingsText: "0.00",
    },
  },

  async onShow() {
    ensureState()
    let config = this.data.shop
    let orders = []

    try {
      ;[config, orders] = await Promise.all([getConfig(), getOrders()])
    } catch (error) {
      orders = []
    }

    const ownedIds = getOwnedOrderIds()
    const profile = getCustomerProfile()
    const fulfillmentType = profile.address === "到店自取" ? "pickup" : this.data.fulfillmentType
    this.setData({
      shop: { ...this.data.shop, ...config },
      myOrders: orders.filter((item) => ownedIds.includes(item.id)).map(mapMyOrder),
      customerProfileId: getCustomerId(),
      customerName: profile.name || "",
      phone: profile.phone || "",
      address: profile.address || "意库",
      remark: profile.remark || "",
      fulfillmentType,
      rememberHint: profile.remark ? "已自动带出上次备注，可直接修改。" : "",
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
        ...totals,
      },
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
      address: fulfillmentType === "pickup" ? "到店自取" : this.data.address === "到店自取" ? "意库" : this.data.address,
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
    if (!this.data.customerName) {
      wx.showToast({ title: "请先填写联系人", icon: "none" })
      return
    }
    if (!this.data.phone) {
      wx.showToast({ title: "请先填写手机号", icon: "none" })
      return
    }
    if (!this.data.address) {
      wx.showToast({ title: "请先填写配送地址", icon: "none" })
      return
    }

    try {
      const order = await createOrder({
        customerId: this.data.customerProfileId || getCustomerId(),
        customerName: this.data.customerName,
        phone: this.data.phone,
        fulfillmentType: this.data.fulfillmentType,
        address: this.data.address,
        remark: this.data.remark,
        items: this.data.cart,
        totals: this.data.totals,
      })

      saveCustomerProfile({
        name: this.data.customerName,
        phone: this.data.phone,
        address: this.data.address,
        remark: this.data.remark,
      })
      addOwnedOrderId(order.id)
      clearCart()
      this.setData({
        rememberHint: this.data.remark ? "备注已记住，下次会自动带出。" : "",
      })
      this.refreshCart()
      wx.navigateTo({ url: `/pages/payment/index?orderId=${order.id}` })
    } catch (error) {
      wx.showToast({ title: error.message || "下单失败", icon: "none" })
    }
  },
})
