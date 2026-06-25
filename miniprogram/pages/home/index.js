const { catalog, discounted, toPriceText } = require("../../utils/pricing")
const { getProducts, getConfig } = require("../../utils/api")
const { ensureState, setOwnerSession } = require("../../utils/state")

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
    hotSoups: [],
    featuredCards: [],
    showOwnerModal: false,
    ownerCode: "",
  },

  async onShow() {
    ensureState()
    let config = this.data.shop
    let products = catalog.soups.map((item) => ({ ...item, category: "soup" }))

    try {
      ;[config, products] = await Promise.all([getConfig(), getProducts()])
    } catch (error) {
      // Fall back to local catalog when remote service is unavailable.
    }

    const sourceSoupMap = new Map(catalog.soups.map((item) => [item.id, item]))
    const hotSoups = products
      .filter((item) => item.category === "soup")
      .map((item) => {
        const source = sourceSoupMap.get(item.id) || {}
        const baseStock = Number(source.baseStock || item.stock || 0)
        const soldCount = Math.max(0, baseStock - Number(item.stock || 0))
        return {
          ...item,
          soldCount,
          salePriceText: toPriceText(discounted(item.price, config.discountRate || catalog.shop.discountRate)),
          originalText: toPriceText(item.price),
          hotLabel: getHotLabel({ ...item, soldCount }),
        }
      })
      .sort((a, b) => {
        if (b.soldCount !== a.soldCount) return b.soldCount - a.soldCount
        return a.stock - b.stock
      })
      .slice(0, 4)

    this.setData({
      shop: { ...this.data.shop, ...config },
      hotSoups,
      featuredCards: [
        {
          title: "每天现点现做",
          desc: "不是预制热一热，顾客拿到手里应该是有温度、有香气的一份炖汤。",
        },
        {
          title: "一个人也能轻松运营",
          desc: "小程序会把订单、库存、耗材和日报收在一起，店长手机上就能处理。",
        },
        {
          title: "复购路径更清楚",
          desc: "积分、老客券、连续下单奖励放在同一条链路里，顾客更容易回头。",
        },
      ],
      availableCount: products.filter((item) => Number(item.stock || 0) > 0).length,
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
