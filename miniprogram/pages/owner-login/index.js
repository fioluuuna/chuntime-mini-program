const { ownerLogin } = require("../../utils/api")
const { hasOwnerSession, setOwnerSession } = require("../../utils/state")

Page({
  data: {
    code: "",
    loading: false,
  },

  onShow() {
    if (hasOwnerSession()) {
      wx.redirectTo({ url: "/pages/admin/index" })
    }
  },

  bindInput(e) {
    this.setData({ code: e.detail.value })
  },

  async submit() {
    if (!this.data.code) {
      wx.showToast({ title: "请输入店长密码", icon: "none" })
      return
    }
    this.setData({ loading: true })
    try {
      await ownerLogin(this.data.code)
      setOwnerSession(true)
      wx.redirectTo({ url: "/pages/admin/index" })
    } catch (error) {
      wx.showToast({ title: error.message || "登录失败", icon: "none" })
    } finally {
      this.setData({ loading: false })
    }
  },
})
