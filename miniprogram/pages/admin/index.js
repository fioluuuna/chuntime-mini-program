const { catalog } = require("../../utils/pricing")

Page({
  data: {
    shop: catalog.shop,
    summaryCards: [
      { label: "今日订单", value: 28 },
      { label: "今日销售额", value: "¥612.4" },
      { label: "预订占用", value: 19 },
      { label: "现可售库存", value: 42 },
    ],
    stocks: catalog.soups.slice(0, 5).map((item) => ({
      name: item.name,
      reserved: Math.max(0, Math.floor(item.stock * 0.4)),
      stock: item.stock,
      remaining: item.stock - Math.max(0, Math.floor(item.stock * 0.4)),
    })),
    reportText:
      "今日汇总：先看预订，再确认库存，随后开放现单。当前不做采购建议，只做库存确认和售罄控制。",
  },
  copyReport() {
    wx.setClipboardData({
      data: this.data.reportText,
      success: () => {
        wx.showToast({ title: "已复制", icon: "success" })
      },
    })
  },
})

