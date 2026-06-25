const { getMember } = require("../../utils/api")

Page({
  data: {
    points: 0,
    balance: 0,
    coupons: [],
    membership: "普通会员"
  },

  async onShow() {
    try {
      const member = await getMember()
      this.setData({
        points: member.points,
        balance: member.balance,
        coupons: member.coupons,
        membership: member.membership
      })
    } catch (error) {
      wx.showToast({ title: "后端未连接，会员数据暂不可用", icon: "none" })
    }
  }
})

