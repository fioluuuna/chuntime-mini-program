const defaultStore = {
  config: {
    shopName: "炖时光",
    address: "广州市番禺区东艺路意库创意十街66栋108号",
    phone: "19120670520",
    hours: "11:00-19:00",
    deliveryAreas: ["金山谷", "保利", "意库"],
    deliveryFee: 3,
    discountRate: 0.88,
    openingDiscountText: "开业 88 折，优惠期 10 天",
    saleMode: "preorder"
  },
  products: [
    {
      id: "soup-01",
      category: "soup",
      name: "橄榄百合龙骨汤",
      price: 18,
      image: "/assets/images/dish-01.jpg",
      desc: "清肺利咽，益气养血，宁心安神",
      stock: 18
    },
    {
      id: "soup-02",
      category: "soup",
      name: "五指毛桃茯苓龙骨汤",
      price: 18,
      image: "/assets/images/dish-02.jpg",
      desc: "健脾祛湿，清肝排毒",
      stock: 16
    },
    {
      id: "soup-03",
      category: "soup",
      name: "黄精虫草花土鸡汤",
      price: 18,
      image: "/assets/images/dish-03.jpg",
      desc: "滋阴补肾，健脾养胃",
      stock: 14
    },
    {
      id: "soup-04",
      category: "soup",
      name: "西洋参石斛土鸡汤",
      price: 20,
      image: "/assets/images/dish-04.jpg",
      desc: "益气化痰，滋阴清肺",
      stock: 12
    },
    {
      id: "soup-05",
      category: "soup",
      name: "党参陈皮龙骨汤",
      price: 20,
      image: "/assets/images/dish-07.jpg",
      desc: "养阴润肺，清热利湿，清心安神",
      stock: 11
    },
    {
      id: "soup-06",
      category: "soup",
      name: "灵芝石斛龙骨汤",
      price: 20,
      image: "/assets/images/dish-08.jpg",
      desc: "熬夜虚火，养心安神，适合口干舌燥人群",
      stock: 10
    },
    {
      id: "soup-07",
      category: "soup",
      name: "红萝卜汤",
      price: 15,
      image: "/assets/images/dish-10.jpg",
      desc: "清甜暖胃，适合日常搭配",
      stock: 18
    },
    {
      id: "soup-08",
      category: "soup",
      name: "凉瓜汤",
      price: 15,
      image: "/assets/images/dish-09.jpg",
      desc: "清爽微苦，适合夏天",
      stock: 18
    },
    {
      id: "soup-09",
      category: "soup",
      name: "冬瓜汤",
      price: 15,
      image: "/assets/images/dish-06.jpg",
      desc: "清润解腻，适合搭配主食",
      stock: 18
    },
    {
      id: "noodle-01",
      category: "noodle",
      name: "葱油菠菜面",
      price: 9.9,
      image: "/assets/images/dish-09.jpg",
      desc: "清香葱油，面条爽滑",
      stock: 20
    },
    {
      id: "noodle-02",
      category: "noodle",
      name: "肉酱菠菜面",
      price: 12.9,
      image: "/assets/images/dish-10.jpg",
      desc: "浓郁肉酱，饱腹满足",
      stock: 20
    }
  ],
  member: {
    points: 1260,
    balance: 300,
    membership: "金卡会员",
    orderCount: 3,
    lastOrderAt: "",
    coupons: [
      { id: "coupon-88-1", title: "88折券", desc: "全单使用", type: "discount" },
      { id: "coupon-88-2", title: "88折券", desc: "全单使用", type: "discount" },
      { id: "coupon-soup-1", title: "炖汤兑换券", desc: "可兑换指定汤品", type: "gift" }
    ]
  },
  orders: [
    {
      id: "CTA103",
      name: "陈小姐",
      phone: "13800000001",
      fulfillmentType: "配送",
      address: "金山谷",
      remark: "",
      items: [
        { productId: "soup-02", productName: "五指毛桃茯苓龙骨汤", quantity: 1, price: 15.84 },
        { productId: "noodle-01", productName: "葱油菠菜面", quantity: 1, price: 8.71 }
      ],
      totals: { subtotal: 27.9, discountedSubtotal: 24.55, shipping: 3, savings: 3.35, total: 27.55 },
      status: "待接单",
      createdAt: "2026/06/25 10:32:00"
    }
  ]
}

module.exports = {
  defaultStore
}

