const { catalog } = require("../../utils/pricing")

Page({
  data: {
    shop: catalog.shop,
    routeImage: "/assets/images/store-route.jpg",
  },
  previewRoute() {
    wx.previewImage({
      current: this.data.routeImage,
      urls: [this.data.routeImage],
    })
  },
  callShop() {
    wx.makePhoneCall({ phoneNumber: this.data.shop.phone })
  },
})

