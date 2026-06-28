const SOLAR_TERMS = [
  { key: "xiaohan", name: "小寒", month: 1, day: 5, image: "/assets/seasonal/xiaohan.jpg", label: "小寒 · 宜温补", preheatLabel: "小寒将至 · 宜暖胃", copy: "用一碗热汤，把冷气挡在门外。" },
  { key: "dahan", name: "大寒", month: 1, day: 20, image: "/assets/seasonal/dahan.jpg", label: "大寒 · 宜藏养", preheatLabel: "大寒将至 · 宜慢炖", copy: "天气越冷，越适合喝一口慢慢炖出来的安心。" },
  { key: "lichun", name: "立春", month: 2, day: 4, image: "/assets/seasonal/lichun.jpg", label: "立春 · 宜鲜润", preheatLabel: "立春将至 · 宜清润", copy: "春意初来，汤也该喝得轻盈一点。" },
  { key: "yushui", name: "雨水", month: 2, day: 19, image: "/assets/seasonal/yushui.jpg", label: "雨水 · 宜温润", preheatLabel: "雨水将至 · 宜润养", copy: "带一点湿气的日子，喝点温润的最舒服。" },
  { key: "jingzhe", name: "惊蛰", month: 3, day: 5, image: "/assets/seasonal/jingzhe.jpg", label: "惊蛰 · 宜提气", preheatLabel: "惊蛰将至 · 宜焕醒", copy: "春雷未响之前，先把身体唤醒。" },
  { key: "chunfen", name: "春分", month: 3, day: 20, image: "/assets/seasonal/chunfen.jpg", label: "春分 · 宜平衡", preheatLabel: "春分将至 · 宜清和", copy: "昼夜平分，入口也该恰到好处。" },
  { key: "qingming", name: "清明", month: 4, day: 4, image: "/assets/seasonal/qingming.jpg", label: "清明 · 宜清爽", preheatLabel: "清明将至 · 宜轻养", copy: "天色明净的时候，来一份清清爽爽的热汤。" },
  { key: "guyu", name: "谷雨", month: 4, day: 20, image: "/assets/seasonal/guyu.jpg", label: "谷雨 · 宜鲜养", preheatLabel: "谷雨将至 · 宜鲜活", copy: "雨生百谷，也适合把鲜味喝进身体里。" },
  { key: "lixia", name: "立夏", month: 5, day: 5, image: "/assets/seasonal/lixia.jpg", label: "立夏 · 宜轻补", preheatLabel: "立夏将至 · 宜提神", copy: "天气一热，喝汤也可以很轻盈。" },
  { key: "xiaoman", name: "小满", month: 5, day: 21, image: "/assets/seasonal/xiaoman.jpg", label: "小满 · 宜顺口", preheatLabel: "小满将至 · 宜润燥", copy: "未满刚好，汤也讲究一种舒服不过头。" },
  { key: "mangzhong", name: "芒种", month: 6, day: 5, image: "/assets/seasonal/mangzhong.jpg", label: "芒种 · 宜养胃", preheatLabel: "芒种将至 · 宜缓一缓", copy: "忙的时候，更要给自己留一口热的。" },
  { key: "xiazhi", name: "夏至", month: 6, day: 21, image: "/assets/seasonal/xiazhi.jpg", label: "夏至 · 宜解暑", preheatLabel: "夏至将至 · 宜清甜", copy: "日长汤暖，来一口清甜也能很有满足感。" },
  { key: "xiaoshu", name: "小暑", month: 7, day: 7, image: "/assets/seasonal/xiaoshu.jpg", label: "小暑 · 宜清润", preheatLabel: "小暑将至 · 宜轻负担", copy: "天气开始热起来，汤也该喝得更清润。" },
  { key: "dashu", name: "大暑", month: 7, day: 23, image: "/assets/seasonal/dashu.jpg", label: "大暑 · 宜解腻", preheatLabel: "大暑将至 · 宜解暑", copy: "热到冒汗的时候，最需要一份热汤带来的舒展。" },
  { key: "liqiu", name: "立秋", month: 8, day: 7, image: "/assets/seasonal/liqiu.jpg", label: "立秋 · 宜润燥", preheatLabel: "立秋将至 · 宜暖润", copy: "秋意刚起，喝点温润的正合适。" },
  { key: "chushu", name: "处暑", month: 8, day: 23, image: "/assets/seasonal/chushu.jpg", label: "处暑 · 宜收燥", preheatLabel: "处暑将至 · 宜慢补", copy: "暑气渐退，味道也可以从清爽转向醇厚。" },
  { key: "bailu", name: "白露", month: 9, day: 7, image: "/assets/seasonal/bailu.jpg", label: "白露 · 宜润喉", preheatLabel: "白露将至 · 宜温柔一点", copy: "早晚渐凉，一碗热汤最知道分寸。" },
  { key: "qiufen", name: "秋分", month: 9, day: 23, image: "/assets/seasonal/qiufen.jpg", label: "秋分 · 宜滋润", preheatLabel: "秋分将至 · 宜平和", copy: "秋色正浓的时候，入口也该温温柔柔。" },
  { key: "hanlu", name: "寒露", month: 10, day: 8, image: "/assets/seasonal/hanlu.jpg", label: "寒露 · 宜暖身", preheatLabel: "寒露将至 · 宜藏暖", copy: "冷意一深，热汤就是最直接的安慰。" },
  { key: "shuangjiang", name: "霜降", month: 10, day: 23, image: "/assets/seasonal/shuangjiang.jpg", label: "霜降 · 宜厚养", preheatLabel: "霜降将至 · 宜补一补", copy: "天气转凉，喝点更醇一点的正是时候。" },
  { key: "lidong", name: "立冬", month: 11, day: 7, image: "/assets/seasonal/lidong.jpg", label: "立冬 · 宜进补", preheatLabel: "立冬将至 · 宜暖胃", copy: "一到立冬，就更想认真喝一盅汤。" },
  { key: "xiaoxue", name: "小雪", month: 11, day: 22, image: "/assets/seasonal/xiaoxue.jpg", label: "小雪 · 宜热饮", preheatLabel: "小雪将至 · 宜热乎乎", copy: "轻轻冷下来的天气，适合把一口热意留在心里。" },
  { key: "daxue", name: "大雪", month: 12, day: 7, image: "/assets/seasonal/daxue.jpg", label: "大雪 · 宜浓汤", preheatLabel: "大雪将至 · 宜暖养", copy: "外面越冷，里面越想要一口扎实的暖。" },
  { key: "dongzhi", name: "冬至", month: 12, day: 21, image: "/assets/seasonal/dongzhi.jpg", label: "冬至 · 宜团圆", preheatLabel: "冬至将至 · 宜暖心", copy: "冬至将满，一口热汤最有家的感觉。" },
]

function toDate(year, month, day) {
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

function shiftDays(date, amount) {
  const next = new Date(date.getTime())
  next.setDate(next.getDate() + amount)
  return next
}

function buildOccurrences(year) {
  return SOLAR_TERMS.map((item) => ({
    ...item,
    date: toDate(year, item.month, item.day),
  }))
}

function getSolarTermTheme(inputDate = new Date()) {
  const now = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 12, 0, 0, 0)
  const occurrences = [...buildOccurrences(now.getFullYear() - 1), ...buildOccurrences(now.getFullYear()), ...buildOccurrences(now.getFullYear() + 1)]
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  for (let index = 0; index < occurrences.length; index += 1) {
    const current = occurrences[index]
    const next = occurrences[index + 1]
    const preheatStart = shiftDays(current.date, -7)
    const nextPreheatStart = next ? shiftDays(next.date, -7) : shiftDays(current.date, 14)

    if (now >= preheatStart && now < current.date) {
      return {
        ...current,
        isPreheat: true,
        title: current.preheatLabel,
      }
    }

    if (now >= current.date && now < nextPreheatStart) {
      return {
        ...current,
        isPreheat: false,
        title: current.label,
      }
    }
  }

  const fallback = SOLAR_TERMS[0]
  return {
    ...fallback,
    isPreheat: false,
    title: fallback.label,
  }
}

module.exports = {
  SOLAR_TERMS,
  getSolarTermTheme,
}
