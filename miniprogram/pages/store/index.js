const { catalog } = require("../../utils/pricing")
const { getConfig } = require("../../utils/api")

Page({
  data: {
    shop: catalog.shop,
    routeImage: "/assets/images/store-route.jpg"
  },
  async onShow() {
    try {
      const config = await getConfig()
      this.setData({ shop: { ...this.data.shop, ...config } })
    } catch (error) {}
  },
  previewRoute() {
    wx.previewImage({
      current: this.data.routeImage,
      urls: [this.data.routeImage],
    })
  },
  callShop() {
    wx.makePhoneCall({ phoneNumber: this.data.shop.phone })
  }
})
