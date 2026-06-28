const { catalog, discounted, toPriceText } = require("../../utils/pricing")
const { getProducts, getConfig } = require("../../utils/api")
const { ensureState, setOwnerSession } = require("../../utils/state")
const { getSolarTermTheme } = require("../../utils/solar-terms")

const SIGNATURE_COPY = {
  "soup-02": "慢炖数小时，汤头温润耐喝，很多人第一单就会点它。",
  "soup-03": "鸡汤香气更明显，想喝得满足一点就很适合。",
  "soup-04": "更醇厚的精致口感，适合当一份认真吃的午餐。",
  "soup-07": "清甜暖胃，轻负担但很有记忆点。",
}

const SIGNATURE_BADGES = {
  "soup-02": "人气爆单",
  "soup-03": "招牌必点",
  "soup-04": "热销推荐",
  "soup-07": "清甜首选",
}

function getHotLabel(item) {
  if (item.stock <= 5) {
    return `仅剩 ${item.stock} 份`
  }
  return `今日已售 ${item.soldCount} 份`
}

Page({
  data: {
    shop: catalog.shop,
    heroImage: catalog.images.hero,
    routeImage: catalog.images.route,
    ownerQrImage: catalog.images.paymentQr,
    availableCount: 0,
    signatureSoups: [],
    freshScenes: [],
    showOwnerModal: false,
    ownerCode: "",
    currentSwiper: 0,
    seasonTheme: getSolarTermTheme(new Date()),
  },

  async onShow() {
    ensureState()
    const seasonTheme = getSolarTermTheme(new Date())
    let config = this.data.shop
    let products = catalog.soups.map((item) => ({ ...item, category: "soup" }))

    try {
      ;[config, products] = await Promise.all([getConfig(), getProducts()])
    } catch (error) {
      // Use local catalog fallback.
    }

    const sourceSoupMap = new Map(catalog.soups.map((item) => [item.id, item]))
    const activeSoups = products.filter((item) => item.category === "soup" && item.isActive !== false)
    const signatureSoups = activeSoups
      .map((item) => {
        const source = sourceSoupMap.get(item.id) || {}
        const baseStock = Number(source.baseStock || item.baseStock || item.stock || 0)
        const soldCount = Math.max(0, baseStock - Number(item.stock || 0))
        return {
          ...item,
          soldCount,
          salePriceText: toPriceText(discounted(item.price, config.discountRate || catalog.shop.discountRate)),
          originalText: toPriceText(item.price),
          hotLabel: getHotLabel({ ...item, soldCount }),
          badge: SIGNATURE_BADGES[item.id] || "人气推荐",
          marketingLine: SIGNATURE_COPY[item.id] || item.desc,
        }
      })
      .sort((a, b) => {
        if (b.soldCount !== a.soldCount) return b.soldCount - a.soldCount
        return a.stock - b.stock
      })
      .slice(0, 4)

    this.setData({
      shop: { ...this.data.shop, ...config },
      heroImage: seasonTheme.image || catalog.images.hero,
      seasonTheme,
      signatureSoups,
      freshScenes: [
        {
          id: "scene-01",
          image: "/assets/images/dish-01.jpg",
          overlay: "每日新鲜采购",
          title: "食材新鲜，是第一眼就该看得见的安心感。",
        },
        {
          id: "scene-02",
          image: "/assets/images/dish-03.jpg",
          overlay: "拒绝预制，现点现做",
          title: "不是流水线热一热，送到手上的时候应该还带着香气。",
        },
        {
          id: "scene-03",
          image: "/assets/images/dish-07.jpg",
          overlay: "热汤现出",
          title: "想做的是让人喝完会记住的那种舒服和满足。",
        },
      ],
      availableCount: products.filter((item) => item.isActive !== false && Number(item.stock || 0) > 0).length,
    })
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

  handleLogoTap() {
    const now = Date.now()
    const recent = (this.logoTapTimes || []).filter((time) => now - time < 1600)
    recent.push(now)
    this.logoTapTimes = recent

    if (recent.length >= 5) {
      this.logoTapTimes = []
      this.setData({
        showOwnerModal: true,
        ownerCode: "",
      })
    }
  },

  bindOwnerCode(e) {
    this.setData({ ownerCode: e.detail.value })
  },

  closeOwnerModal() {
    this.setData({
      showOwnerModal: false,
      ownerCode: "",
    })
  },

  confirmOwnerAccess() {
    if (this.data.ownerCode !== "dsg2026") {
      wx.showToast({ title: "密码错误", icon: "none" })
      return
    }
    setOwnerSession(true)
    this.setData({
      showOwnerModal: false,
      ownerCode: "",
    })
    wx.navigateTo({ url: "/pages/admin/index" })
  },

  handleSwiperChange(e) {
    this.setData({ currentSwiper: e.detail.current || 0 })
  },

  prevSignature() {
    const total = this.data.signatureSoups.length
    if (!total) return
    const nextIndex = (this.data.currentSwiper - 1 + total) % total
    this.setData({ currentSwiper: nextIndex })
  },

  nextSignature() {
    const total = this.data.signatureSoups.length
    if (!total) return
    const nextIndex = (this.data.currentSwiper + 1) % total
    this.setData({ currentSwiper: nextIndex })
  },

  previewRoute() {
    wx.previewImage({
      current: this.data.routeImage,
      urls: [this.data.routeImage],
    })
  },

  previewQr() {
    wx.previewImage({
      current: this.data.ownerQrImage,
      urls: [this.data.ownerQrImage],
    })
  },

  copyAddress() {
    wx.setClipboardData({
      data: this.data.shop.address,
      success: () => {
        wx.showToast({ title: "地址已复制", icon: "success" })
      },
    })
  },

  callShop() {
    wx.makePhoneCall({ phoneNumber: this.data.shop.phone })
  },
})
