const { catalog, discounted, toPriceText } = require("../../utils/pricing")
const { getOrders, getProducts, getConfig } = require("../../utils/api")
const { ensureState } = require("../../utils/state")

Page({
  async onShow() {
    ensureState()
    let config = this.data.shop
    let products = catalog.soups.map((item) => ({ ...item, category: "soup" }))
    let orders = []
    try {
      ;[config, products, orders] = await Promise.all([getConfig(), getProducts(), getOrders()])
    } catch (error) {
      wx.showToast({ title: "后端未连接，首页使用演示数据", icon: "none" })
    }
    const soups = products
      .filter((item) => item.category === "soup")
      .slice(0, 4)
      .map((item) => ({
        ...item,
        salePrice: toPriceText(discounted(item.price, config.discountRate || catalog.shop.discountRate)),
        originalText: toPriceText(item.price)
      }))
    this.setData({
      shop: { ...this.data.shop, ...config },
      soups,
      orderCount: orders.length,
      availableCount: products.filter((item) => item.stock > 0).length
    })
  },
  data: {
    shop: catalog.shop,
    highlights: catalog.highlights,
    routeImage: catalog.images.route,
    menuPoster: catalog.images.menuPoster,
    orderCount: 0,
    availableCount: 0,
    soups: [],
  },
  goTo(e) {
    const page = e.currentTarget.dataset.page
    const tabPages = ["home", "menu", "combo", "member", "store"]
    if (tabPages.includes(page)) {
      wx.switchTab({ url: `/pages/${page}/index` })
      return
    }
    wx.navigateTo({ url: `/pages/${page}/index` })
  },
  previewRoute() {
    wx.previewImage({
      current: this.data.routeImage,
      urls: [this.data.routeImage],
    })
  },
})
