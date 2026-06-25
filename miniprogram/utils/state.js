const KEYS = {
  cart: "ct_cart"
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function ensureState() {
  const savedCart = wx.getStorageSync(KEYS.cart)
  if (!savedCart) {
    wx.setStorageSync(KEYS.cart, [])
  }
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
  image,
  category,
  quantity = 1,
  parts = []
}) {
  const cart = getCart()
  const index = cart.findIndex((item) => item.productId === productId)
  if (index >= 0) {
    cart[index].quantity += quantity
  } else {
    cart.push({
      id: `cart-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      productId,
      productName,
      price,
      image,
      category,
      quantity,
      parts
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

function calculateCartTotals(cart, discountRate, deliveryFee, fulfillmentType = "配送") {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountedSubtotal = Math.round(subtotal * 100) / 100
  const shipping = cart.length && fulfillmentType === "配送" ? deliveryFee : 0
  const total = Math.round((discountedSubtotal + shipping) * 100) / 100
  const originalSubtotal = cart.reduce((sum, item) => {
    if (item.parts?.length) {
      const partSum = item.parts.reduce((partTotal, part) => partTotal + part.originalPrice * part.quantity, 0)
      return sum + partSum * item.quantity
    }
    return sum + item.originalPrice * item.quantity
  }, 0)
  return {
    subtotal: Math.round(originalSubtotal * 100) / 100,
    discountedSubtotal,
    shipping,
    total,
    savings: Math.round((originalSubtotal - discountedSubtotal) * 100) / 100
  }
}

module.exports = {
  KEYS,
  ensureState,
  getCart,
  saveCart,
  addCartItem,
  updateCartQuantity,
  clearCart,
  calculateCartTotals
}

