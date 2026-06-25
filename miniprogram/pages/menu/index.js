const { catalog, discounted, toPriceText, buildCombo } = require("../../utils/pricing")
const { getProducts: getRemoteProducts, getConfig } = require("../../utils/api")
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
    categories: [
      { key: "soup", label: "炖汤" },
      { key: "noodle", label: "面食" },
      { key: "combo", label: "套餐" },
    ],
    activeCategory: "soup",
    menuScrollTop: 0,
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
    let products = [
      ...catalog.soups.map((item) => ({ ...item, category: "soup" })),
      ...catalog.noodles.map((item) => ({ ...item, category: "noodle" })),
    ]

    try {
      ;[settings, products] = await Promise.all([getConfig(), getRemoteProducts()])
    } catch (error) {
      // Fall back to local catalog data.
    }

    const cart = getCart()
    const soupItems = products
      .filter((item) => item.category === "soup")
      .map((item) => mapProduct(item, settings.discountRate))
    const noodleItems = products
      .filter((item) => item.category === "noodle")
      .map((item) => mapProduct(item, settings.discountRate))

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const selectedSoupId = soupItems.some((item) => item.id === this.data.selectedSoupId)
      ? this.data.selectedSoupId
      : ((soupItems.find((item) => !item.soldOut) || soupItems[0] || {}).id || "")
    const selectedNoodleId = noodleItems.some((item) => item.id === this.data.selectedNoodleId)
      ? this.data.selectedNoodleId
      : ((noodleItems.find((item) => !item.soldOut) || noodleItems[0] || {}).id || "")

    this.setData({
      shop: { ...this.data.shop, ...settings },
      soups: soupItems,
      noodles: noodleItems,
      selectedSoupId,
      selectedNoodleId,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      cartTotalText: toPriceText(cartTotal),
    })
    this.refreshComboSummary()
    wx.nextTick(() => {
      this.measureSections()
      setTimeout(() => {
        this.measureSections()
      }, 280)
    })
  },

  measureSections() {
    const query = wx.createSelectorQuery().in(this)
    query.select(".menu-content-scroll").boundingClientRect()
    query.select("#section-soup").boundingClientRect()
    query.select("#section-noodle").boundingClientRect()
    query.select("#section-combo").boundingClientRect()
    query.exec((res) => {
      const [scrollRect, soupRect, noodleRect, comboRect] = res || []
      if (!scrollRect || !soupRect || !noodleRect || !comboRect) return

      const currentScrollTop = this.data.menuScrollTop || 0
      this.sectionTopMap = {
        soup: Math.max(0, soupRect.top - scrollRect.top + currentScrollTop),
        noodle: Math.max(0, noodleRect.top - scrollRect.top + currentScrollTop),
        combo: Math.max(0, comboRect.top - scrollRect.top + currentScrollTop),
      }
    })
  },

  selectCategory(e) {
    const key = e.currentTarget.dataset.key
    const nextTop = this.sectionTopMap && typeof this.sectionTopMap[key] === "number"
      ? Math.max(0, this.sectionTopMap[key] - 8)
      : 0

    this.setData({
      activeCategory: key,
      menuScrollTop: nextTop,
    })
  },

  handleMenuScroll(e) {
    const scrollTop = e.detail.scrollTop || 0
    const topMap = this.sectionTopMap || {}
    const entries = Object.keys(topMap).map((key) => ({ key, top: topMap[key] }))
    if (!entries.length) {
      this.setData({ menuScrollTop: scrollTop })
      return
    }

    let activeCategory = entries[0].key
    for (let i = 0; i < entries.length; i += 1) {
      if (scrollTop + 24 >= entries[i].top) {
        activeCategory = entries[i].key
      }
    }

    this.setData({
      menuScrollTop: scrollTop,
      activeCategory,
    })
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
    wx.showToast({ title: "已加入购物车", icon: "success" })
  },

  addById(e) {
    const itemId = e.currentTarget.dataset.id
    const item = [...this.data.soups, ...this.data.noodles].find((row) => row.id === itemId)
    this.addItem(item)
  },

  chooseComboSoup(e) {
    const item = this.data.soups.find((row) => row.id === e.currentTarget.dataset.id)
    if (!item || item.soldOut) return
    this.setData({ selectedSoupId: item.id })
    this.refreshComboSummary()
  },

  chooseComboNoodle(e) {
    const item = this.data.noodles.find((row) => row.id === e.currentTarget.dataset.id)
    if (!item || item.soldOut) return
    this.setData({ selectedNoodleId: item.id })
    this.refreshComboSummary()
  },

  refreshComboSummary() {
    const soup = this.data.soups.find((item) => item.id === this.data.selectedSoupId)
    const noodle = this.data.noodles.find((item) => item.id === this.data.selectedNoodleId)

    if (!soup || !noodle) {
      this.setData({ comboSummary: null })
      return
    }

    const result = buildCombo(soup, noodle, this.data.shop.discountRate || catalog.shop.discountRate)
    this.setData({
      comboSummary: {
        soup,
        noodle,
        originalText: toPriceText(result.original),
        finalText: toPriceText(result.final),
        savingsText: toPriceText(result.savings),
        final: result.final,
      },
    })
  },

  addCombo() {
    const summary = this.data.comboSummary
    if (!summary || summary.soup.soldOut || summary.noodle.soldOut) {
      wx.showToast({ title: "套餐内有商品已售罄", icon: "none" })
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
      ],
    })
    this.refresh()
    wx.showToast({ title: "套餐已加入购物车", icon: "success" })
  },

  goCheckout() {
    wx.switchTab({ url: "/pages/order/index" })
  },
})
