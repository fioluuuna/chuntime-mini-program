const { catalog, discounted, toPriceText } = require("../../utils/pricing")
const { getProducts, getConfig, getServiceMode } = require("../../utils/api")
const { ensureState } = require("../../utils/state")

Page({
  async onShow() {
    ensureState()
    let config = this.data.shop
    let products = catalog.soups.map((item) => ({ ...item, category: "soup" }))
    ;[config, products] = await Promise.all([getConfig(), getProducts()])
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
      featuredCards: [
        {
          title: "慢炖现做",
          desc: "每天新鲜炖煮，尽量让顾客拿到的是热的、顺口的、安心的一份汤。",
        },
        {
          title: "配送更省心",
          desc: "覆盖金山谷、保利、意库，统一配送费 3 元，也支持自提。",
        },
        {
          title: "老客更划算",
          desc: "积分可兑炖汤，老客券包和储值活动一起做，复购路径更清晰。",
        },
      ],
      availableCount: products.filter((item) => item.stock > 0).length,
      serviceMode: getServiceMode(),
    })
  },
  data: {
    shop: catalog.shop,
    routeImage: catalog.images.route,
    menuPoster: catalog.images.menuPoster,
    availableCount: 0,
    soups: [],
    featuredCards: [],
    serviceMode: "remote",
  },
  goTo(e) {
    const page = e.currentTarget.dataset.page
    const tabPages = ["home", "menu", "order", "member"]
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
  copyAddress() {
    wx.setClipboardData({
      data: this.data.shop.address,
      success: () => {
        wx.showToast({ title: "地址已复制", icon: "success" })
      }
    })
  },
  callShop() {
    wx.makePhoneCall({ phoneNumber: this.data.shop.phone })
  }
})
