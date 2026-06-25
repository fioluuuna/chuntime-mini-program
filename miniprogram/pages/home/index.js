const { catalog, discounted, toPriceText } = require("../../utils/pricing")

Page({
  data: {
    shop: catalog.shop,
    highlights: catalog.highlights,
    soups: catalog.soups.slice(0, 4).map((item) => ({
      ...item,
      salePrice: toPriceText(discounted(item.price, catalog.shop.discountRate)),
      originalText: toPriceText(item.price),
    })),
    routeImage: "/assets/images/store-route.jpg",
    menuPoster: "/assets/images/menu-poster.jpg",
  },
  goTo(e) {
    const page = e.currentTarget.dataset.page
    wx.navigateTo({ url: `/pages/${page}/index` })
  },
  previewRoute() {
    wx.previewImage({
      current: this.data.routeImage,
      urls: [this.data.routeImage],
    })
  },
})

