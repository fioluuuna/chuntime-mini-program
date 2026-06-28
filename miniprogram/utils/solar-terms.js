const SOLAR_TERMS = [
  { key: "xiaohan", name: "小寒", month: 1, day: 5, image: "/assets/seasonal/xiaohan.png", label: "小寒 · 宜暖身", preheatLabel: "小寒将至 · 宜暖身", tip: "宜暖身", copy: "用一碗热汤，把冷气挡在门外。" },
  { key: "dahan", name: "大寒", month: 1, day: 20, image: "/assets/seasonal/dahan.png", label: "大寒 · 宜温阳", preheatLabel: "大寒将至 · 宜温阳", tip: "宜温阳", copy: "天气越冷，越适合喝一口慢慢炖出来的安心。" },
  { key: "lichun", name: "立春", month: 2, day: 3, image: "/assets/seasonal/lichun.png", label: "立春 · 宜养肝", preheatLabel: "立春将至 · 宜养肝", tip: "宜养肝", copy: "春意初来，汤也该喝得轻盈一点。" },
  { key: "yushui", name: "雨水", month: 2, day: 18, image: "/assets/seasonal/yushui.png", label: "雨水 · 宜健脾", preheatLabel: "雨水将至 · 宜健脾", tip: "宜健脾", copy: "带一点湿气的日子，喝点温润的最舒服。" },
  { key: "jingzhe", name: "惊蛰", month: 3, day: 5, image: "/assets/seasonal/jingzhe.png", label: "惊蛰 · 宜舒肝", preheatLabel: "惊蛰将至 · 宜舒肝", tip: "宜舒肝", copy: "春雷未响之前，先把身体唤醒。" },
  { key: "chunfen", name: "春分", month: 3, day: 20, image: "/assets/seasonal/chunfen.png", label: "春分 · 宜平衡", preheatLabel: "春分将至 · 宜平衡", tip: "宜平衡", copy: "昼夜平分，入口也该恰到好处。" },
  { key: "qingming", name: "清明", month: 4, day: 4, image: "/assets/seasonal/qingming.png", label: "清明 · 宜清补", preheatLabel: "清明将至 · 宜清补", tip: "宜清补", copy: "天色明净的时候，来一份清清爽爽的热汤。" },
  { key: "guyu", name: "谷雨", month: 4, day: 19, image: "/assets/seasonal/guyu.png", label: "谷雨 · 宜祛湿", preheatLabel: "谷雨将至 · 宜祛湿", tip: "宜祛湿", copy: "雨生百谷，也适合把鲜味喝进身体里。" },
  { key: "lixia", name: "立夏", month: 5, day: 5, image: "/assets/seasonal/lixia.png", label: "立夏 · 宜养心", preheatLabel: "立夏将至 · 宜养心", tip: "宜养心", copy: "天气一热，喝汤也可以很轻盈。" },
  { key: "xiaoman", name: "小满", month: 5, day: 20, image: "/assets/seasonal/xiaoman.png", label: "小满 · 宜祛湿", preheatLabel: "小满将至 · 宜祛湿", tip: "宜祛湿", copy: "未满刚好，汤也讲究一种舒服不过头。" },
  { key: "mangzhong", name: "芒种", month: 6, day: 5, image: "/assets/seasonal/mangzhong.png", label: "芒种 · 宜清热", preheatLabel: "芒种将至 · 宜清热", tip: "宜清热", copy: "忙的时候，更要给自己留一口热的。" },
  { key: "xiazhi", name: "夏至", month: 6, day: 21, image: "/assets/seasonal/xiazhi.png", label: "夏至 · 宜解暑", preheatLabel: "夏至将至 · 宜解暑", tip: "宜解暑", copy: "日长汤暖，来一口清甜也能很有满足感。" },
  { key: "xiaoshu", name: "小暑", month: 7, day: 7, image: "/assets/seasonal/xiaoshu.png", label: "小暑 · 宜消暑", preheatLabel: "小暑将至 · 宜消暑", tip: "宜消暑", copy: "天气开始热起来，汤也该喝得更清润。" },
  { key: "dashu", name: "大暑", month: 7, day: 22, image: "/assets/seasonal/dashu.png", label: "大暑 · 宜清热", preheatLabel: "大暑将至 · 宜清热", tip: "宜清热", copy: "热到冒汗的时候，最需要一份热汤带来的舒展。" },
  { key: "liqiu", name: "立秋", month: 8, day: 7, image: "/assets/seasonal/liqiu.png", label: "立秋 · 宜润燥", preheatLabel: "立秋将至 · 宜润燥", tip: "宜润燥", copy: "秋意刚起，喝点温润的正合适。" },
  { key: "chushu", name: "处暑", month: 8, day: 22, image: "/assets/seasonal/chushu.png", label: "处暑 · 宜滋阴", preheatLabel: "处暑将至 · 宜滋阴", tip: "宜滋阴", copy: "暑气渐退，味道也可以从清爽转向醇厚。" },
  { key: "bailu", name: "白露", month: 9, day: 7, image: "/assets/seasonal/bailu.png", label: "白露 · 宜润肺", preheatLabel: "白露将至 · 宜润肺", tip: "宜润肺", copy: "早晚渐凉，一碗热汤最知道分寸。" },
  { key: "qiufen", name: "秋分", month: 9, day: 22, image: "/assets/seasonal/qiufen.png", label: "秋分 · 宜润燥", preheatLabel: "秋分将至 · 宜润燥", tip: "宜润燥", copy: "秋色正浓的时候，入口也该温温柔柔。" },
  { key: "hanlu", name: "寒露", month: 10, day: 8, image: "/assets/seasonal/hanlu.png", label: "寒露 · 宜温补", preheatLabel: "寒露将至 · 宜温补", tip: "宜温补", copy: "冷意一深，热汤就是最直接的安慰。" },
  { key: "shuangjiang", name: "霜降", month: 10, day: 23, image: "/assets/seasonal/shuangjiang.png", label: "霜降 · 宜养胃", preheatLabel: "霜降将至 · 宜养胃", tip: "宜养胃", copy: "天气转凉，喝点更醇一点的正是时候。" },
  { key: "lidong", name: "立冬", month: 11, day: 7, image: "/assets/seasonal/lidong.png", label: "立冬 · 宜温补", preheatLabel: "立冬将至 · 宜温补", tip: "宜温补", copy: "一到立冬，就更想认真喝一盅汤。" },
  { key: "xiaoxue", name: "小雪", month: 11, day: 22, image: "/assets/seasonal/xiaoxue.png", label: "小雪 · 宜补肾", preheatLabel: "小雪将至 · 宜补肾", tip: "宜补肾", copy: "轻轻冷下来的天气，适合把一口热意留在心里。" },
  { key: "daxue", name: "大雪", month: 12, day: 6, image: "/assets/seasonal/daxue.png", label: "大雪 · 宜温阳", preheatLabel: "大雪将至 · 宜温阳", tip: "宜温阳", copy: "外面越冷，里面越想要一口扎实的暖。" },
  { key: "dongzhi", name: "冬至", month: 12, day: 21, image: "/assets/seasonal/dongzhi.png", label: "冬至 · 宜温补", preheatLabel: "冬至将至 · 宜温补", tip: "宜温补", copy: "冬至将满，一口热汤最有家的感觉。" },
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
        title: current.name,
      }
    }

    if (now >= current.date && now < nextPreheatStart) {
      return {
        ...current,
        isPreheat: false,
        title: current.name,
      }
    }
  }

  const fallback = SOLAR_TERMS[0]
  return {
    ...fallback,
    isPreheat: false,
    title: fallback.name,
  }
}

module.exports = {
  SOLAR_TERMS,
  getSolarTermTheme,
}
