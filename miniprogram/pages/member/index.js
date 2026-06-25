const { getMember, getOrders, getServiceMode } = require("../../utils/api")

Page({
  data: {
    points: 0,
    balance: 0,
    coupons: [],
    membership: "普通会员",
    orderCount: 0,
    serviceMode: "remote",
    benefitCards: [
      { title: "积分抵扣", desc: "300 分可兑换 1 份炖汤" },
      { title: "老客优惠券", desc: "下单后沉淀券包，推动二次复购" },
      { title: "连续下单奖励", desc: "连续消费可解锁额外兑换权益" },
    ],
    rechargePlans: [
      { id: "plan-300", title: "充 300", desc: "送 3 张 88 折券", extra: "全单使用" },
      { id: "plan-500", title: "充 500", desc: "送 6 张 88 折券", extra: "再送炖汤 2 份" },
      { id: "plan-1000", title: "充 1000", desc: "送 10 张 88 折券", extra: "再送炖汤 5 份" },
    ],
    growthPercent: 0,
    nextLevelTip: "",
  },

  async onShow() {
    const [member, orders] = await Promise.all([getMember(), getOrders()])
    const orderCount = Number(member.orderCount || orders.length || 0)
    const nextThreshold = orderCount < 5 ? 5 : orderCount < 10 ? 10 : 10
    const growthPercent = nextThreshold === 10 && orderCount >= 10
      ? 100
      : Math.min(100, Math.round((orderCount / nextThreshold) * 100))
    this.setData({
      points: member.points,
      balance: member.balance,
      coupons: member.coupons,
      membership: member.membership,
      orderCount,
      serviceMode: getServiceMode(),
      growthPercent,
      nextLevelTip: orderCount >= 10 ? "已经是当前最高会员等级" : `再下 ${nextThreshold - orderCount} 单可升级`
    })
  },

  showPlanInfo(e) {
    const plan = this.data.rechargePlans.find((item) => item.id === e.currentTarget.dataset.id)
    if (!plan) return
    wx.showModal({
      title: plan.title,
      content: `${plan.desc}，${plan.extra}。后续接入商家微信支付后可直接在线充值。`,
      showCancel: false
    })
  },

  openOwnerLogin() {
    wx.navigateTo({ url: "/pages/owner-login/index" })
  }
})
