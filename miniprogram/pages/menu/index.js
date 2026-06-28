const { catalog, discounted, toPriceText, buildCombo, canUseSoupForCombo } = require("../../utils/pricing")
const { getProducts: getRemoteProducts, getConfig, getCombos } = require("../../utils/api")
const { getCart, addCartItem, ensureState } = require("../../utils/state")

function mapProduct(item, discountRate) {
  return {
    ...item,
    compareAtPrice: Number(item.compareAtPrice || item.price || 0),
    salePrice: Number(toPriceText(discounted(item.price, discountRate))),
    salePriceText: toPriceText(discounted(item.price, discountRate)),
    basePriceText: toPriceText(item.price),
    compareAtPriceText: toPriceText(item.compareAtPrice || item.price),
    soldOut: item.isActive === false || Number(item.stock || 0) <= 0,
  }
}

function mapCombo(item, noodle, discountRate) {
  const baseDisplay = discounted(item.price, discountRate)
  return {
    ...item,
    noodleName: noodle ? noodle.name : "未绑定面食",
    noodleImage: noodle ? noodle.image : "",
    noodleDesc: noodle ? noodle.desc : "请在后台重新绑定面食",
    startingPriceText: toPriceText(baseDisplay),
    limitText: Number(item.maxSoupPrice || 0) > 0 ? `仅可选 ${toPriceText(item.maxSoupPrice)} 元及以下炖汤` : "可选任意炖汤",
    isAvailable: item.isActive !== false && !!noodle && noodle.isActive !== false && Number(noodle.stock || 0) > 0,
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
    soups: [],
    noodles: [],
    combos: [],
    cartCount: 0,
    cartTotalText: "0.00",
    pageScrollTop: 0,
    showComboPicker: false,
    activeCombo: null,
    comboSoupOptions: [],
    selectedComboSoupId: "",
    comboDraft: null,
  },

  onShow() {
    ensureState()
    this.refresh()
  },

  onPageScroll(e) {
    const scrollTop = e.scrollTop || 0
    this.pageScrollTop = scrollTop
    this.syncActiveCategory(scrollTop)
  },

  async refresh() {
    let settings = { discountRate: catalog.shop.discountRate }
    let products = [
      ...catalog.soups.map((item) => ({ ...item, category: "soup" })),
      ...catalog.noodles.map((item) => ({ ...item, category: "noodle" })),
    ]
    let combos = catalog.combos

    try {
      ;[settings, products, combos] = await Promise.all([getConfig(), getRemoteProducts(), getCombos()])
    } catch (error) {
      // Use local fallback data.
    }

    const cart = getCart()
    const soupItems = products
      .filter((item) => item.category === "soup" && item.isActive !== false)
      .map((item) => mapProduct(item, settings.discountRate))
    const noodleItems = products
      .filter((item) => item.category === "noodle" && item.isActive !== false)
      .map((item) => mapProduct(item, settings.discountRate))
    const noodleMap = new Map(noodleItems.map((item) => [item.id, item]))
    const comboItems = combos
      .filter((item) => item.isActive !== false)
      .map((item) => mapCombo(item, noodleMap.get(item.noodleId), settings.discountRate))

    const cartTotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0)

    this.setData({
      shop: { ...this.data.shop, ...settings },
      soups: soupItems,
      noodles: noodleItems,
      combos: comboItems,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      cartTotalText: toPriceText(cartTotal),
    })

    wx.nextTick(() => {
      this.measureSections()
      setTimeout(() => {
        this.measureSections()
      }, 260)
    })
  },

  measureSections() {
    const query = wx.createSelectorQuery().in(this)
    query.selectViewport().scrollOffset()
    query.select("#section-soup").boundingClientRect()
    query.select("#section-noodle").boundingClientRect()
    query.select("#section-combo").boundingClientRect()
    query.exec((res) => {
      const [viewport, soupRect, noodleRect, comboRect] = res || []
      const baseScrollTop = typeof viewport?.scrollTop === "number" ? viewport.scrollTop : this.pageScrollTop || 0
      if (!soupRect || !noodleRect || !comboRect) return

      this.sectionTopMap = {
        soup: Math.max(0, soupRect.top + baseScrollTop),
        noodle: Math.max(0, noodleRect.top + baseScrollTop),
        combo: Math.max(0, comboRect.top + baseScrollTop),
      }
      this.syncActiveCategory(baseScrollTop)
    })
  },

  syncActiveCategory(scrollTop) {
    const topMap = this.sectionTopMap
    if (!topMap) return

    const watchLine = scrollTop + 180
    let activeCategory = "soup"
    if (watchLine >= topMap.combo) {
      activeCategory = "combo"
    } else if (watchLine >= topMap.noodle) {
      activeCategory = "noodle"
    }

    if (activeCategory !== this.data.activeCategory) {
      this.setData({ activeCategory })
    }
  },

  selectCategory(e) {
    const key = e.currentTarget.dataset.key
    const topMap = this.sectionTopMap || {}
    const targetTop = typeof topMap[key] === "number" ? Math.max(0, topMap[key] - 108) : 0

    this.setData({ activeCategory: key })
    wx.pageScrollTo({
      scrollTop: targetTop,
      duration: 260,
    })
  },

  addItem(item) {
    if (!item || item.soldOut) return
    addCartItem({
      productId: item.id,
      productName: item.name,
      price: item.salePrice,
      originalPrice: item.price,
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

  openCombo(e) {
    const comboId = e.currentTarget.dataset.id
    const combo = this.data.combos.find((item) => item.id === comboId)
    if (!combo || !combo.isAvailable) {
      wx.showToast({ title: "当前套餐暂不可点", icon: "none" })
      return
    }

    const comboSoupOptions = this.data.soups.filter((item) => !item.soldOut && canUseSoupForCombo(combo, item))
    if (!comboSoupOptions.length) {
      wx.showToast({ title: "当前没有符合条件的汤品", icon: "none" })
      return
    }

    const selectedComboSoupId = comboSoupOptions[0].id
    this.setData({
      showComboPicker: true,
      activeCombo: combo,
      comboSoupOptions,
      selectedComboSoupId,
    })
    this.refreshComboDraft()
  },

  closeComboPicker() {
    this.setData({
      showComboPicker: false,
      activeCombo: null,
      comboSoupOptions: [],
      selectedComboSoupId: "",
      comboDraft: null,
    })
  },

  chooseComboSoup(e) {
    const soupId = e.currentTarget.dataset.id
    const soup = this.data.comboSoupOptions.find((item) => item.id === soupId)
    if (!soup) return
    this.setData({ selectedComboSoupId: soupId })
    this.refreshComboDraft()
  },

  refreshComboDraft() {
    const combo = this.data.activeCombo
    const soup = this.data.comboSoupOptions.find((item) => item.id === this.data.selectedComboSoupId)
    if (!combo || !soup) {
      this.setData({ comboDraft: null })
      return
    }

    if (!canUseSoupForCombo(combo, soup)) {
      this.setData({
        selectedComboSoupId: "",
        comboDraft: null,
      })
      wx.showToast({ title: "该汤品超出套餐限制，已自动清空", icon: "none" })
      return
    }

    const result = buildCombo(combo, soup, this.data.shop.discountRate || catalog.shop.discountRate)
    this.setData({
      comboDraft: {
        combo,
        soup,
        originalText: toPriceText(result.original),
        finalText: toPriceText(result.final),
        savingsText: toPriceText(result.savings),
        final: result.final,
      },
    })
  },

  confirmComboAdd() {
    const draft = this.data.comboDraft
    if (!draft) {
      wx.showToast({ title: "请先选择汤品", icon: "none" })
      return
    }
    addCartItem({
      productId: `combo:${draft.combo.id}:${draft.soup.id}`,
      comboId: draft.combo.id,
      productName: `${draft.combo.name} + ${draft.soup.name}`,
      price: draft.final,
      originalPrice: Number(draft.originalText),
      image: draft.soup.image || draft.combo.noodleImage,
      category: "combo",
      quantity: 1,
      parts: [
        { productId: draft.soup.id, productName: draft.soup.name, quantity: 1, originalPrice: draft.soup.price },
        { productId: draft.combo.noodleId, productName: draft.combo.noodleName, quantity: 1, originalPrice: draft.combo.price },
      ],
    })
    this.closeComboPicker()
    this.refresh()
    wx.showToast({ title: "套餐已加入购物车", icon: "success" })
  },

  goCheckout() {
    wx.switchTab({ url: "/pages/order/index" })
  },
})
