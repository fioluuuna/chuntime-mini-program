const { catalog, discounted, toPriceText, buildCombo } = require("../../utils/pricing")
const { getProducts: getRemoteProducts, getConfig, getServiceMode } = require("../../utils/api")
const { getCart, addCartItem, ensureState } = require("../../utils/state")

function mapProduct(item, discountRate) {
  return {
    ...item,
    originalPrice: item.price,
    salePrice: Number(toPriceText(discounted(item.price, discountRate))),
    salePriceText: toPriceText(discounted(item.price, discountRate)),
    originalText: toPriceText(item.price),
    soldOut: Number(item.stock || 0) <= 0,
  }
}

Page({
  data: {
    shop: catalog.shop,
    poster: catalog.images.menuPoster,
    serviceMode: "remote",
    categories: [
      { key: "soup", label: "炖汤" },
      { key: "noodle", label: "面食" },
      { key: "combo", label: "套餐" },
    ],
    activeCategory: "soup",
    soups: [],
    noodles: [],
    selectedSoupId: "",
    selectedNoodleId: "",
    comboSummary: null,
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
    ;[settings, products] = await Promise.all([getConfig(), getRemoteProducts()])
    const cart = getCart()
    const soupItems = products.filter((item) => item.category === "soup").map((item) => mapProduct(item, settings.discountRate))
    const noodleItems = products.filter((item) => item.category === "noodle").map((item) => mapProduct(item, settings.discountRate))
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const selectedSoupId = soupItems.some((item) => item.id === this.data.selectedSoupId)
      ? this.data.selectedSoupId
      : (soupItems[0] && soupItems[0].id) || ""
    const selectedNoodleId = noodleItems.some((item) => item.id === this.data.selectedNoodleId)
      ? this.data.selectedNoodleId
      : (noodleItems[0] && noodleItems[0].id) || ""
    this.setData({
      shop: { ...this.data.shop, ...settings },
      soups: soupItems,
      noodles: noodleItems,
      selectedSoupId,
      selectedNoodleId,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      cartTotalText: toPriceText(cartTotal),
      serviceMode: getServiceMode(),
    })
    this.refreshComboSummary()
  },

  previewPoster() {
    wx.previewImage({
      current: this.data.poster,
      urls: [this.data.poster],
    })
  },

  selectCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.key })
  },

  addItem(item) {
    if (!item || item.soldOut) return
    addCartItem({
      productId: item.id,
      productName: item.name,
      price: item.salePrice,
      originalPrice: item.originalPrice,
      image: item.image,
      category: item.category,
      quantity: 1,
    })
    this.refresh()
    wx.showToast({ title: "已加入", icon: "success" })
  },

  addById(e) {
    const itemId = e.currentTarget.dataset.id
    const item = [...this.data.soups, ...this.data.noodles].find((row) => row.id === itemId)
    this.addItem(item)
  },

  chooseComboSoup(e) {
    this.setData({ selectedSoupId: e.currentTarget.dataset.id })
    this.refreshComboSummary()
  },

  chooseComboNoodle(e) {
    this.setData({ selectedNoodleId: e.currentTarget.dataset.id })
    this.refreshComboSummary()
  },

  refreshComboSummary() {
    const soup = this.data.soups.find((item) => item.id === this.data.selectedSoupId)
    const noodle = this.data.noodles.find((item) => item.id === this.data.selectedNoodleId)
    if (!soup || !noodle) {
      this.setData({ comboSummary: null })
      return
    }
    const result = buildCombo(soup, noodle, this.data.shop.discountRate)
    this.setData({
      comboSummary: {
        soup,
        noodle,
        originalText: toPriceText(result.original),
        finalText: toPriceText(result.final),
        savingsText: toPriceText(result.savings),
        final: result.final,
      }
    })
  },

  addCombo() {
    const summary = this.data.comboSummary
    if (!summary || summary.soup.soldOut || summary.noodle.soldOut) {
      wx.showToast({ title: "套餐内有商品售罄", icon: "none" })
      return
    }
    addCartItem({
      productId: `combo:${summary.soup.id}:${summary.noodle.id}`,
      productName: `${summary.soup.name} + ${summary.noodle.name}`,
      price: summary.final,
      originalPrice: Number(summary.originalText),
      image: summary.soup.image,
      category: "combo",
      quantity: 1,
      parts: [
        { productId: summary.soup.id, productName: summary.soup.name, quantity: 1, originalPrice: summary.soup.originalPrice },
        { productId: summary.noodle.id, productName: summary.noodle.name, quantity: 1, originalPrice: summary.noodle.originalPrice },
      ]
    })
    this.refresh()
    wx.showToast({ title: "套餐已加入", icon: "success" })
  },

  goCheckout() {
    wx.navigateTo({ url: "/pages/order/index" })
  },
})
