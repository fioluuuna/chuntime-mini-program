const { catalog, buildCombo, discounted, toPriceText } = require("../../utils/pricing")

Page({
  data: {
    shop: catalog.shop,
    soups: catalog.soups,
    noodles: catalog.noodles,
    soupIndex: 0,
    noodleIndex: 0,
    summary: null,
  },

  onLoad() {
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
      },
    })
  },
})

