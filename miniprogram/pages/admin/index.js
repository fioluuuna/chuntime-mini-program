const {
  getDashboard,
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getCombos,
  addCombo,
  updateCombo,
  deleteCombo,
  getMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  resetDemo,
  getOrders,
  updateOrderStatus,
  getLedger,
  addLedgerIncome,
  addLedgerExpense,
  uploadImageBase64,
} = require("../../utils/api")
const { hasOwnerSession, clearOwnerSession } = require("../../utils/state")

const MATERIAL_GROUP_ORDER = ["packaging", "kitchen"]
const PRODUCT_CATEGORY_OPTIONS = [
  { label: "炖汤", value: "soup" },
  { label: "面食", value: "noodle" },
]
const MATERIAL_GROUP_OPTIONS = [
  { label: "包材耗材", value: "packaging" },
  { label: "食材辅料", value: "kitchen" },
]

function getTodayDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getOrderStatusText(status) {
  switch (status) {
    case "pending_payment":
      return "待付款"
    case "pending_confirm":
      return "待确认"
    case "completed":
      return "已完成"
    default:
      return "处理中"
  }
}

function getStatusClass(status) {
  switch (status) {
    case "pending_payment":
      return "pending-payment"
    case "pending_confirm":
      return "pending-confirm"
    case "completed":
      return "completed"
    case "warning":
      return "warning"
    case "inactive":
      return "inactive"
    case "normal":
    case "active":
    default:
      return "normal"
  }
}

function getFulfillmentText(type) {
  return type === "pickup" ? "自提" : "配送"
}

function mapMaterial(item) {
  return {
    ...item,
    statusClass: getStatusClass(item.statusKey),
  }
}

function mapProduct(item) {
  return {
    ...item,
    categoryText: item.category === "soup" ? "炖汤" : "面食",
    statusText: item.isActive === false ? "已下架" : "已上架",
    statusClass: item.isActive === false ? "inactive" : "normal",
    compareAtPriceText: Number(item.compareAtPrice || item.price || 0).toFixed(2),
    priceText: Number(item.price || 0).toFixed(2),
  }
}

function mapCombo(item) {
  return {
    ...item,
    statusText: item.isActive === false ? "已下架" : "已上架",
    statusClass: item.isActive === false ? "inactive" : "normal",
    priceText: Number(item.price || 0).toFixed(2),
    limitText: Number(item.maxSoupPrice || 0) > 0 ? `限 ${Number(item.maxSoupPrice).toFixed(2)} 元以下炖汤` : "不限制汤品价格",
  }
}

function mapOrder(item) {
  return {
    ...item,
    statusText: getOrderStatusText(item.status),
    statusClass: getStatusClass(item.status),
    fulfillmentText: getFulfillmentText(item.fulfillmentType),
  }
}

function groupMaterials(materials) {
  const buckets = {}
  materials.forEach((item) => {
    const key = item.groupKey || "other"
    if (!buckets[key]) {
      buckets[key] = {
        key,
        title: item.groupLabel || "其他物料",
        items: [],
      }
    }
    buckets[key].items.push(item)
  })

  return Object.values(buckets).sort((a, b) => {
    const aIndex = MATERIAL_GROUP_ORDER.indexOf(a.key)
    const bIndex = MATERIAL_GROUP_ORDER.indexOf(b.key)
    const safeA = aIndex === -1 ? 999 : aIndex
    const safeB = bIndex === -1 ? 999 : bIndex
    return safeA - safeB
  })
}

function getEmptyProductForm() {
  return {
    id: "",
    name: "",
    price: "",
    compareAtPrice: "",
    desc: "",
    category: "soup",
    stock: "0",
    image: "",
    isActive: true,
  }
}

function getEmptyComboForm() {
  return {
    id: "",
    name: "",
    price: "",
    desc: "",
    noodleId: "",
    maxSoupPrice: "0",
    isActive: true,
  }
}

function getEmptyMaterialForm() {
  return {
    id: "",
    name: "",
    unit: "个",
    stock: "0",
    warningLine: "0",
    groupKey: "packaging",
  }
}

Page({
  data: {
    summaryCards: [],
    products: [],
    combos: [],
    materials: [],
    materialGroups: [],
    materialAlerts: [],
    reportText: "",
    orders: [],
    visibleOrders: [],
    orderFilter: "all",
    activeModule: "products",
    showOrderDetail: false,
    currentOrder: null,
    editorVisible: false,
    editorType: "",
    editorMode: "create",
    editorTitle: "",
    productForm: getEmptyProductForm(),
    comboForm: getEmptyComboForm(),
    materialForm: getEmptyMaterialForm(),
    productCategoryIndex: 0,
    comboNoodleIndex: 0,
    comboNoodleOptions: [],
    comboNoodleIds: [],
    materialGroupIndex: 0,
    imageUploading: false,
    ledgerDate: getTodayDate(),
    ledger: {
      summary: {
        incomeText: "￥0.00",
        expenseText: "￥0.00",
        balanceText: "￥0.00",
      },
      incomeEntries: [],
      expenseEntries: [],
    },
    incomeSources: ["堂食收款码", "现金", "微信收款", "支付宝", "其他"],
    expenseCategories: ["食材采购", "调料", "包装耗材", "水电", "其他"],
    incomeSourceIndex: 0,
    expenseCategoryIndex: 0,
    incomeAmount: "",
    incomeRemark: "",
    expenseAmount: "",
    expenseRemark: "",
    analytics: {
      topSoups: [],
      topHours: [],
      topCustomers: [],
    },
  },

  async onShow() {
    if (!hasOwnerSession()) {
      wx.switchTab({ url: "/pages/home/index" })
      return
    }
    await this.refresh()
  },

  async refresh() {
    const ledgerDate = this.data.ledgerDate || getTodayDate()
    try {
      const [dashboard, orders, products, combos, materials, ledger] = await Promise.all([
        getDashboard(),
        getOrders(),
        getProducts(),
        getCombos(),
        getMaterials(),
        getLedger(ledgerDate),
      ])
      const mappedProducts = products.map(mapProduct)
      const mappedCombos = combos.map(mapCombo)
      const mappedMaterials = materials.map(mapMaterial)
      const noodleOptions = mappedProducts.filter((item) => item.category === "noodle")

      this.setData({
        summaryCards: dashboard.summaryCards,
        reportText: dashboard.reportText,
        analytics: dashboard.analytics || this.data.analytics,
        orders: orders.map(mapOrder),
        products: mappedProducts,
        combos: mappedCombos,
        materials: mappedMaterials,
        materialGroups: groupMaterials(mappedMaterials),
        materialAlerts: (dashboard.materialAlerts || []).map(mapMaterial),
        comboNoodleOptions: noodleOptions,
        comboNoodleIds: noodleOptions.map((item) => item.id),
        ledgerDate,
        ledger,
      })
      this.applyOrderFilter()
    } catch (error) {
      wx.showToast({ title: "后台数据加载失败", icon: "none" })
    }
  },

  applyOrderFilter() {
    const filter = this.data.orderFilter
    const visibleOrders = this.data.orders.filter((item) => {
      if (filter === "all") return true
      return item.status === filter
    })
    this.setData({ visibleOrders })
  },

  changeModule(e) {
    this.setData({ activeModule: e.currentTarget.dataset.module })
  },

  changeOrderFilter(e) {
    this.setData({ orderFilter: e.currentTarget.dataset.filter })
    this.applyOrderFilter()
  },

  copyReport() {
    wx.setClipboardData({
      data: this.data.reportText,
      success: () => wx.showToast({ title: "今日摘要已复制", icon: "success" }),
    })
  },

  openCreateProduct() {
    this.setData({
      editorVisible: true,
      editorType: "product",
      editorMode: "create",
      editorTitle: "新增菜品",
      productForm: getEmptyProductForm(),
      productCategoryIndex: 0,
    })
  },

  openEditProduct(e) {
    const product = this.data.products.find((item) => item.id === e.currentTarget.dataset.id)
    if (!product) return
    this.setData({
      editorVisible: true,
      editorType: "product",
      editorMode: "edit",
      editorTitle: "编辑菜品",
      productForm: {
        id: product.id,
        name: product.name,
        price: String(product.price),
        compareAtPrice: String(product.compareAtPrice || product.price),
        desc: product.desc,
        category: product.category,
        stock: String(product.stock),
        image: product.image,
        isActive: product.isActive !== false,
      },
      productCategoryIndex: PRODUCT_CATEGORY_OPTIONS.findIndex((item) => item.value === product.category),
    })
  },

  async toggleProductStatus(e) {
    const product = this.data.products.find((item) => item.id === e.currentTarget.dataset.id)
    if (!product) return
    try {
      await updateProduct(product.id, { isActive: product.isActive === false })
      await this.refresh()
      wx.showToast({ title: product.isActive === false ? "已上架" : "已下架", icon: "success" })
    } catch (error) {
      wx.showToast({ title: error.message || "更新失败", icon: "none" })
    }
  },

  deleteProduct(e) {
    const productId = e.currentTarget.dataset.id
    wx.showModal({
      title: "删除菜品",
      content: "删除后将无法恢复，确定继续吗？",
      success: async (res) => {
        if (!res.confirm) return
        try {
          await deleteProduct(productId)
          await this.refresh()
          wx.showToast({ title: "菜品已删除", icon: "success" })
        } catch (error) {
          wx.showToast({ title: error.message || "删除失败", icon: "none" })
        }
      },
    })
  },

  openCreateCombo() {
    const defaultNoodleId = this.data.comboNoodleIds[0] || ""
    this.setData({
      editorVisible: true,
      editorType: "combo",
      editorMode: "create",
      editorTitle: "新增套餐",
      comboForm: {
        ...getEmptyComboForm(),
        noodleId: defaultNoodleId,
      },
      comboNoodleIndex: 0,
    })
  },

  openEditCombo(e) {
    const combo = this.data.combos.find((item) => item.id === e.currentTarget.dataset.id)
    if (!combo) return
    const comboNoodleIndex = Math.max(0, this.data.comboNoodleIds.findIndex((item) => item === combo.noodleId))
    this.setData({
      editorVisible: true,
      editorType: "combo",
      editorMode: "edit",
      editorTitle: "编辑套餐",
      comboForm: {
        id: combo.id,
        name: combo.name,
        price: String(combo.price),
        desc: combo.desc,
        noodleId: combo.noodleId,
        maxSoupPrice: String(combo.maxSoupPrice || 0),
        isActive: combo.isActive !== false,
      },
      comboNoodleIndex,
    })
  },

  async toggleComboStatus(e) {
    const combo = this.data.combos.find((item) => item.id === e.currentTarget.dataset.id)
    if (!combo) return
    try {
      await updateCombo(combo.id, { isActive: combo.isActive === false })
      await this.refresh()
      wx.showToast({ title: combo.isActive === false ? "已上架" : "已下架", icon: "success" })
    } catch (error) {
      wx.showToast({ title: error.message || "更新失败", icon: "none" })
    }
  },

  deleteCombo(e) {
    const comboId = e.currentTarget.dataset.id
    wx.showModal({
      title: "删除套餐",
      content: "删除后将无法恢复，确定继续吗？",
      success: async (res) => {
        if (!res.confirm) return
        try {
          await deleteCombo(comboId)
          await this.refresh()
          wx.showToast({ title: "套餐已删除", icon: "success" })
        } catch (error) {
          wx.showToast({ title: error.message || "删除失败", icon: "none" })
        }
      },
    })
  },

  openCreateMaterial() {
    this.setData({
      editorVisible: true,
      editorType: "material",
      editorMode: "create",
      editorTitle: "新增物料",
      materialForm: getEmptyMaterialForm(),
      materialGroupIndex: 0,
    })
  },

  openEditMaterial(e) {
    const material = this.data.materials.find((item) => item.id === e.currentTarget.dataset.id)
    if (!material) return
    this.setData({
      editorVisible: true,
      editorType: "material",
      editorMode: "edit",
      editorTitle: "编辑物料",
      materialForm: {
        id: material.id,
        name: material.name,
        unit: material.unit,
        stock: String(material.stock),
        warningLine: String(material.warningLine),
        groupKey: material.groupKey,
      },
      materialGroupIndex: MATERIAL_GROUP_OPTIONS.findIndex((item) => item.value === material.groupKey),
    })
  },

  deleteMaterial(e) {
    const materialId = e.currentTarget.dataset.id
    wx.showModal({
      title: "删除物料",
      content: "删除后将无法恢复，确定继续吗？",
      success: async (res) => {
        if (!res.confirm) return
        try {
          await deleteMaterial(materialId)
          await this.refresh()
          wx.showToast({ title: "物料已删除", icon: "success" })
        } catch (error) {
          wx.showToast({ title: error.message || "删除失败", icon: "none" })
        }
      },
    })
  },

  bindFormField(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    if (this.data.editorType === "product") {
      this.setData({ [`productForm.${field}`]: value })
      return
    }
    if (this.data.editorType === "combo") {
      this.setData({ [`comboForm.${field}`]: value })
      return
    }
    if (this.data.editorType === "material") {
      this.setData({ [`materialForm.${field}`]: value })
    }
  },

  chooseProductCategory(e) {
    const index = Number(e.detail.value || 0)
    this.setData({
      productCategoryIndex: index,
      "productForm.category": PRODUCT_CATEGORY_OPTIONS[index].value,
    })
  },

  chooseComboNoodle(e) {
    const index = Number(e.detail.value || 0)
    this.setData({
      comboNoodleIndex: index,
      "comboForm.noodleId": this.data.comboNoodleIds[index] || "",
    })
  },

  chooseMaterialGroup(e) {
    const index = Number(e.detail.value || 0)
    this.setData({
      materialGroupIndex: index,
      "materialForm.groupKey": MATERIAL_GROUP_OPTIONS[index].value,
    })
  },

  async chooseProductImage(e) {
    const sourceType = e.currentTarget.dataset.source === "camera" ? ["camera"] : ["album"]
    try {
      const result = await new Promise((resolve, reject) => {
        wx.chooseMedia({
          count: 1,
          mediaType: ["image"],
          sourceType,
          sizeType: ["compressed"],
          success: resolve,
          fail: reject,
        })
      })
      const media = result?.tempFiles?.[0]
      if (!media?.tempFilePath) return

      this.setData({ imageUploading: true })
      const fsManager = wx.getFileSystemManager()
      const readResult = await new Promise((resolve, reject) => {
        fsManager.readFile({
          filePath: media.tempFilePath,
          encoding: "base64",
          success: resolve,
          fail: reject,
        })
      })
      const extension = media.tempFilePath.split(".").pop() || "jpg"
      const uploaded = await uploadImageBase64({
        base64: readResult.data,
        extension,
        filePath: media.tempFilePath,
      })
      this.setData({
        "productForm.image": uploaded.url || uploaded.path || media.tempFilePath,
        imageUploading: false,
      })
      wx.showToast({ title: "图片已更新", icon: "success" })
    } catch (error) {
      this.setData({ imageUploading: false })
      wx.showToast({ title: error.message || "图片上传失败", icon: "none" })
    }
  },

  closeEditor() {
    this.setData({
      editorVisible: false,
      editorType: "",
      editorMode: "create",
      editorTitle: "",
      imageUploading: false,
    })
  },

  async saveEditor() {
    try {
      if (this.data.editorType === "product") {
        await this.saveProduct()
      } else if (this.data.editorType === "combo") {
        await this.saveCombo()
      } else if (this.data.editorType === "material") {
        await this.saveMaterial()
      }
    } catch (error) {
      wx.showToast({ title: error.message || "保存失败", icon: "none" })
    }
  },

  async saveProduct() {
    const form = this.data.productForm
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      compareAtPrice: Number(form.compareAtPrice || form.price),
      desc: form.desc.trim(),
      category: form.category,
      stock: Number(form.stock),
      image: form.image,
      isActive: form.isActive !== false,
    }
    if (!payload.name || !payload.price || !payload.image) {
      throw new Error("请完整填写菜品名称、价格和图片")
    }
    if (this.data.editorMode === "create") {
      await addProduct(payload)
    } else {
      await updateProduct(form.id, payload)
    }
    await this.refresh()
    this.closeEditor()
    wx.showToast({ title: "菜品已保存", icon: "success" })
  },

  async saveCombo() {
    const form = this.data.comboForm
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      desc: form.desc.trim(),
      noodleId: form.noodleId,
      maxSoupPrice: Number(form.maxSoupPrice || 0),
      isActive: form.isActive !== false,
    }
    if (!payload.name || !payload.price || !payload.noodleId) {
      throw new Error("请完整填写套餐名称、价格和面食")
    }
    if (this.data.editorMode === "create") {
      await addCombo(payload)
    } else {
      await updateCombo(form.id, payload)
    }
    await this.refresh()
    this.closeEditor()
    wx.showToast({ title: "套餐已保存", icon: "success" })
  },

  async saveMaterial() {
    const form = this.data.materialForm
    const payload = {
      name: form.name.trim(),
      unit: form.unit.trim(),
      stock: Number(form.stock),
      warningLine: Number(form.warningLine),
      groupKey: form.groupKey,
    }
    if (!payload.name) {
      throw new Error("请输入物料名称")
    }
    if (this.data.editorMode === "create") {
      await addMaterial(payload)
    } else {
      await updateMaterial(form.id, payload)
    }
    await this.refresh()
    this.closeEditor()
    wx.showToast({ title: "物料已保存", icon: "success" })
  },

  openOrderDetail(e) {
    const order = this.data.orders.find((item) => item.id === e.currentTarget.dataset.id)
    if (!order) return
    this.setData({
      showOrderDetail: true,
      currentOrder: order,
    })
  },

  closeOrderDetail() {
    this.setData({
      showOrderDetail: false,
      currentOrder: null,
    })
  },

  async stepOrder(e) {
    const { id, status } = e.currentTarget.dataset
    try {
      await updateOrderStatus(id, status)
      await this.refresh()
      if (this.data.currentOrder && this.data.currentOrder.id === id) {
        const next = this.data.orders.find((item) => item.id === id)
        this.setData({ currentOrder: next || null, showOrderDetail: !!next })
      }
    } catch (error) {
      wx.showToast({ title: error.message || "更新失败", icon: "none" })
    }
  },

  changeLedgerDate(e) {
    this.setData({ ledgerDate: e.detail.value })
    this.loadLedger(e.detail.value)
  },

  async loadLedger(date) {
    try {
      const ledger = await getLedger(date)
      this.setData({ ledger })
    } catch (error) {
      wx.showToast({ title: "记账数据加载失败", icon: "none" })
    }
  },

  changeIncomeSource(e) {
    this.setData({ incomeSourceIndex: Number(e.detail.value || 0) })
  },

  changeExpenseCategory(e) {
    this.setData({ expenseCategoryIndex: Number(e.detail.value || 0) })
  },

  bindIncomeAmount(e) {
    this.setData({ incomeAmount: e.detail.value })
  },

  bindIncomeRemark(e) {
    this.setData({ incomeRemark: e.detail.value })
  },

  bindExpenseAmount(e) {
    this.setData({ expenseAmount: e.detail.value })
  },

  bindExpenseRemark(e) {
    this.setData({ expenseRemark: e.detail.value })
  },

  async submitIncome() {
    const amount = Number(this.data.incomeAmount)
    if (!amount || amount <= 0) {
      wx.showToast({ title: "请输入正确金额", icon: "none" })
      return
    }
    const source = this.data.incomeSources[this.data.incomeSourceIndex] || "其他"
    try {
      await addLedgerIncome({
        date: this.data.ledgerDate,
        amount,
        source,
        remark: this.data.incomeRemark.trim(),
      })
      this.setData({
        incomeAmount: "",
        incomeRemark: "",
      })
      await this.refresh()
      wx.showToast({ title: "收入已记录", icon: "success" })
    } catch (error) {
      wx.showToast({ title: error.message || "记录失败", icon: "none" })
    }
  },

  async submitExpense() {
    const amount = Number(this.data.expenseAmount)
    if (!amount || amount <= 0) {
      wx.showToast({ title: "请输入正确金额", icon: "none" })
      return
    }
    const category = this.data.expenseCategories[this.data.expenseCategoryIndex] || "其他"
    try {
      await addLedgerExpense({
        date: this.data.ledgerDate,
        amount,
        category,
        remark: this.data.expenseRemark.trim(),
      })
      this.setData({
        expenseAmount: "",
        expenseRemark: "",
      })
      await this.refresh()
      wx.showToast({ title: "支出已记录", icon: "success" })
    } catch (error) {
      wx.showToast({ title: error.message || "记录失败", icon: "none" })
    }
  },

  async resetDemoData() {
    try {
      await resetDemo()
      this.setData({
        ledgerDate: getTodayDate(),
        incomeAmount: "",
        incomeRemark: "",
        expenseAmount: "",
        expenseRemark: "",
        incomeSourceIndex: 0,
        expenseCategoryIndex: 0,
      })
      await this.refresh()
      wx.showToast({ title: "演示数据已重置", icon: "success" })
    } catch (error) {
      wx.showToast({ title: "重置失败", icon: "none" })
    }
  },

  logout() {
    clearOwnerSession()
    wx.switchTab({ url: "/pages/home/index" })
  },
})
