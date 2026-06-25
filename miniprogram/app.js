const { ensureState } = require("./utils/state")

App({
  globalData: {
    shopName: "炖时光",
    discountRate: 0.88,
  },
  onLaunch() {
    ensureState()
  },
})
