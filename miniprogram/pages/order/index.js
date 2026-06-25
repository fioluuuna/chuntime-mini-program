const { catalog } = require("../../utils/pricing")

Page({
  data: {
    orders: catalog.todayOrders,
  },
})

