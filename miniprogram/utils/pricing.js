const catalog = require("../data/catalog")

function round2(value) {
  return Math.round(value * 100) / 100
}

function toPriceText(value) {
  return round2(value).toFixed(2)
}

function discounted(value, rate) {
  return round2(value * rate)
}

function buildCombo(soup, noodle, rate) {
  const original = soup.price + noodle.price
  const final = discounted(original, rate)
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
  buildCombo,
  catalog,
}

