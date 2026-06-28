const catalog = require("../data/catalog")

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100
}

function toPriceText(value) {
  return round2(value).toFixed(2)
}

function discounted(value, rate) {
  return round2(Number(value || 0) * Number(rate || 1))
}

function canUseSoupForCombo(combo, soup) {
  if (!combo || !soup) {
    return false
  }
  const maxSoupPrice = Number(combo.maxSoupPrice || 0)
  if (maxSoupPrice <= 0) {
    return true
  }
  return Number(soup.price || 0) <= maxSoupPrice
}

function buildCombo(first, second, maybeRate) {
  if (!first || !second) {
    return {
      original: 0,
      final: 0,
      savings: 0,
    }
  }

  let original = 0
  if (first.noodleId) {
    original = Number(first.price || 0) + Number(second.price || 0)
  } else {
    original = Number(first.price || 0) + Number(second.price || 0)
  }

  const final = discounted(original, maybeRate)
  return {
    original,
    final,
    savings: round2(original - final),
  }
}

module.exports = {
  round2,
  toPriceText,
  discounted,
  canUseSoupForCombo,
  buildCombo,
  catalog,
}
