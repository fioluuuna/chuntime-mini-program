const { catalog, buildCombo, discounted, toPriceText } = require("../../utils/pricing")
const { getProducts, getConfig } = require("../../utils/api")
const { addCartItem, ensureState } = require("../../utils/state")

Page({
  data: {
    shop: catalog.shop,
    soups: catalog.soups,
    noodles: catalog.noodles,
    soupIndex: 0,
    noodleIndex: 0,
    summary: null,
  },

  async onShow() {
    ensureState()
    try {
      const [config, products] = await Promise.all([getConfig(), getProducts()])
      this.setData({
        shop: { ...catalog.shop, discountRate: config.discountRate },
        soups: products.filter((item) => item.category === "soup"),
        noodles: products.filter((item) => item.category === "noodle")
      })
    } catch (error) {
      wx.showToast({ title: "后端未连接，使用演示数据", icon: "none" })
    }
    this.refreshSummary()
  },

  changeSoup(e) {
    this.setData({ soupIndex: Number(e.detail.value) })
    this.refreshSummary()
  },

  changeNoodle(e) {
    this.setData({ noodleIndex: Number(e.detail.value) })
    this.refreshSummary()
  },

  refreshSummary() {
    const soup = this.data.soups[this.data.soupIndex]
    const noodle = this.data.noodles[this.data.noodleIndex]
    const result = buildCombo(soup, noodle, this.data.shop.discountRate)
    this.setData({
      summary: {
        soupName: soup.name,
        noodleName: noodle.name,
        soupPrice: toPriceText(discounted(soup.price, this.data.shop.discountRate)),
        noodlePrice: toPriceText(discounted(noodle.price, this.data.shop.discountRate)),
        original: toPriceText(result.original),
        final: toPriceText(result.final),
        savings: toPriceText(result.savings),
        image: soup.image,
      },
    })
  },

  addCombo() {
    const soup = this.data.soups[this.data.soupIndex]
    const noodle = this.data.noodles[this.data.noodleIndex]
    const result = buildCombo(soup, noodle, this.data.shop.discountRate)
    addCartItem({
      productId: `combo:${soup.id}:${noodle.id}`,
      productName: `${soup.name} + ${noodle.name}`,
      price: result.final,
      originalPrice: result.original,
      image: soup.image,
      category: "combo",
      quantity: 1,
      parts: [
        { productId: soup.id, productName: soup.name, quantity: 1, originalPrice: soup.price },
        { productId: noodle.id, productName: noodle.name, quantity: 1, originalPrice: noodle.price }
      ]
    })
    wx.showToast({ title: "套餐已加入", icon: "success" })
  },

  goCheckout() {
    wx.navigateTo({ url: "/pages/order/index" })
  },
})
