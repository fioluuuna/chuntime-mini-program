const { catalog, discounted, toPriceText } = require("../../utils/pricing")

Page({
  data: {
    shop: catalog.shop,
    poster: "/assets/images/menu-poster.jpg",
    soups: catalog.soups.map((item) => ({
      ...item,
      salePrice: toPriceText(discounted(item.price, catalog.shop.discountRate)),
      originalText: toPriceText(item.price),
    })),
    noodles: catalog.noodles.map((item) => ({
      ...item,
      salePrice: toPriceText(discounted(item.price, catalog.shop.discountRate)),
      originalText: toPriceText(item.price),
    })),
  },
  previewPoster() {
    wx.previewImage({
      current: this.data.poster,
      urls: [this.data.poster],
    })
  },
})

