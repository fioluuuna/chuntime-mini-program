const { catalog, discounted, toPriceText } = require("../../utils/pricing")
const { getProducts: getRemoteProducts, getConfig } = require("../../utils/api")
const { getCart, addCartItem, ensureState } = require("../../utils/state")

Page({
  data: {
    shop: catalog.shop,
    poster: catalog.images.menuPoster,
    soups: [],
    noodles: [],
    cartCount: 0,
    cartTotalText: "0.00",
  },

  onShow() {
    ensureState()
    this.refresh()
  },

  async refresh() {
    let settings = { discountRate: catalog.shop.discountRate }
    let products = [...catalog.soups.map((item) => ({ ...item, category: "soup" })), ...catalog.noodles.map((item) => ({ ...item, category: "noodle", stock: 20 }))]
    try {
      ;[settings, products] = await Promise.all([getConfig(), getRemoteProducts()])
    } catch (error) {
      wx.showToast({ title: "后端未连接，展示静态菜单", icon: "none" })
    }
    const cart = getCart()
    const mapItem = (item) => ({
      ...item,
      originalPrice: item.price,
      salePrice: toPriceText(discounted(item.price, settings.discountRate)),
      originalText: toPriceText(item.price),
      soldOut: item.stock <= 0,
    })
    const soupItems = products.filter((item) => item.category === "soup").map(mapItem)
    const noodleItems = products.filter((item) => item.category === "noodle").map(mapItem)
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    this.setData({
      soups: soupItems,
      noodles: noodleItems,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      cartTotalText: toPriceText(cartTotal),
    })
  },

  previewPoster() {
    wx.previewImage({
      current: this.data.poster,
      urls: [this.data.poster],
    })
  },

  addSoup(e) {
    const item = this.data.soups.find((row) => row.id === e.currentTarget.dataset.id)
    if (!item || item.soldOut) return
    addCartItem({
      productId: item.id,
      productName: item.name,
      price: Number(item.salePrice),
      originalPrice: item.originalPrice,
      image: item.image,
      category: item.category,
      quantity: 1,
    })
    this.refresh()
    wx.showToast({ title: "已加入", icon: "success" })
  },

  addNoodle(e) {
    const item = this.data.noodles.find((row) => row.id === e.currentTarget.dataset.id)
    if (!item) return
    addCartItem({
      productId: item.id,
      productName: item.name,
      price: Number(item.salePrice),
      originalPrice: item.originalPrice,
      image: item.image,
      category: item.category,
      quantity: 1,
    })
    this.refresh()
    wx.showToast({ title: "已加入", icon: "success" })
  },

  goCheckout() {
    wx.navigateTo({ url: "/pages/order/index" })
  },
})
