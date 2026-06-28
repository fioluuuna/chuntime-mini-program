const KEYS = {
  cart: "ct_cart",
  ownedOrders: "ct_owned_orders",
  ownerSession: "ct_owner_session",
  customerId: "ct_customer_id",
  customerProfile: "ct_customer_profile",
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function createCustomerId() {
  return `customer-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function getDefaultCustomerProfile() {
  return {
    customerId: "",
    name: "",
    phone: "",
    address: "意库",
    remark: "",
  }
}

function ensureState() {
  const savedCart = wx.getStorageSync(KEYS.cart)
  if (!savedCart) {
    wx.setStorageSync(KEYS.cart, [])
  }
  const ownedOrders = wx.getStorageSync(KEYS.ownedOrders)
  if (!ownedOrders) {
    wx.setStorageSync(KEYS.ownedOrders, [])
  }
  const customerId = wx.getStorageSync(KEYS.customerId)
  if (!customerId) {
    wx.setStorageSync(KEYS.customerId, createCustomerId())
  }
  const customerProfile = wx.getStorageSync(KEYS.customerProfile)
  if (!customerProfile) {
    wx.setStorageSync(KEYS.customerProfile, getDefaultCustomerProfile())
  }
}

function getCustomerId() {
  ensureState()
  return wx.getStorageSync(KEYS.customerId)
}

function getCustomerProfile() {
  ensureState()
  const profile = clone(wx.getStorageSync(KEYS.customerProfile))
  return {
    ...getDefaultCustomerProfile(),
    ...profile,
    customerId: getCustomerId(),
  }
}

function saveCustomerProfile(profile) {
  const nextProfile = {
    ...getCustomerProfile(),
    ...clone(profile || {}),
    customerId: getCustomerId(),
  }
  wx.setStorageSync(KEYS.customerProfile, nextProfile)
  return nextProfile
}

function getCart() {
  ensureState()
  return clone(wx.getStorageSync(KEYS.cart))
}

function saveCart(cart) {
  wx.setStorageSync(KEYS.cart, clone(cart))
}

function addCartItem({
  productId,
  productName,
  price,
  originalPrice,
  image,
  category,
  quantity = 1,
  parts = [],
  comboId = "",
  remark = "",
}) {
  const cart = getCart()
  const index = cart.findIndex((item) => item.productId === productId)
  if (index >= 0) {
    cart[index].quantity += quantity
    cart[index].originalPrice = cart[index].originalPrice || originalPrice || price
    if (parts.length) {
      cart[index].parts = parts
    }
  } else {
    cart.push({
      id: `cart-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      productId,
      productName,
      price,
      originalPrice,
      image,
      category,
      quantity,
      parts,
      comboId,
      remark,
    })
  }
  saveCart(cart)
  return cart
}

function updateCartQuantity(cartId, delta) {
  const cart = getCart()
  const index = cart.findIndex((item) => item.id === cartId)
  if (index < 0) {
    return cart
  }
  cart[index].quantity += delta
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1)
  }
  saveCart(cart)
  return cart
}

function clearCart() {
  saveCart([])
}

function getOwnedOrderIds() {
  ensureState()
  return clone(wx.getStorageSync(KEYS.ownedOrders))
}

function addOwnedOrderId(orderId) {
  const ids = getOwnedOrderIds()
  if (!ids.includes(orderId)) {
    ids.unshift(orderId)
    wx.setStorageSync(KEYS.ownedOrders, ids)
  }
  return ids
}

function setOwnerSession(value) {
  wx.setStorageSync(KEYS.ownerSession, !!value)
}

function hasOwnerSession() {
  return !!wx.getStorageSync(KEYS.ownerSession)
}

function clearOwnerSession() {
  wx.removeStorageSync(KEYS.ownerSession)
}

function calculateCartTotals(cart, discountRate, deliveryFee, fulfillmentType = "delivery") {
  const discountedSubtotal = roundCurrency(cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0))
  const shipping = cart.length && fulfillmentType === "delivery" ? Number(deliveryFee || 0) : 0
  const total = roundCurrency(discountedSubtotal + shipping)
  const originalSubtotal = roundCurrency(
    cart.reduce((sum, item) => sum + Number(item.originalPrice || item.price || 0) * item.quantity, 0)
  )
  return {
    subtotal: originalSubtotal,
    discountedSubtotal,
    shipping,
    total,
    savings: roundCurrency(originalSubtotal - discountedSubtotal),
  }
}

function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100
}

module.exports = {
  KEYS,
  ensureState,
  getCustomerId,
  getCustomerProfile,
  saveCustomerProfile,
  getCart,
  saveCart,
  addCartItem,
  updateCartQuantity,
  clearCart,
  getOwnedOrderIds,
  addOwnedOrderId,
  setOwnerSession,
  hasOwnerSession,
  clearOwnerSession,
  calculateCartTotals,
}
