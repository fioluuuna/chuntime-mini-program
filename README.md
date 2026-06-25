# Chuntime Mini Program

`炖时光` 的微信小程序与本地后端项目。

## 当前已经有的能力

- 顾客端：首页、菜单、自由组合套餐、购物车、下单、会员、门店路线
- 店长端：库存确认、库存加减、手机日报、演示数据重置
- 后端：商品、订单、会员、库存、日报接口
- 素材：真实路线图、菜单海报、真实菜品图

## 目录结构

- `miniprogram/`：微信小程序前端
- `backend/`：本地 Node 后端
- `assets/images/`：门店与菜品图片

## 本地运行

### 1. 启动后端

在项目根目录执行：

```powershell
.\start-backend.ps1
```

默认地址：

```text
http://127.0.0.1:3007/api/health
```

### 2. 打开小程序

用微信开发者工具导入根目录 [project.config.json](/E:/炖时光/project.config.json)。

- `miniprogramRoot` 已配置为 `miniprogram/`
- 当前是开发态，接口直连本机 `127.0.0.1:3007`

### 3. 今晚的联调顺序

1. 先运行 `.\start-backend.ps1`
2. 再打开微信开发者工具导入项目
3. 打开首页、菜单页、套餐页、订单页、店长后台逐个测试
4. 如果你妈妈的小程序账号今晚认证完成，再把 `project.config.json` 里的 `appid` 换成正式值

## 关键文件

- [后端服务](/E:/炖时光/backend/server.js)
- [后端初始数据](/E:/炖时光/backend/lib/seed.js)
- [本地购物车状态](/E:/炖时光/miniprogram/utils/state.js)
- [接口封装](/E:/炖时光/miniprogram/utils/api.js)
- [菜单页](/E:/炖时光/miniprogram/pages/menu/index.js)
- [订单页](/E:/炖时光/miniprogram/pages/order/index.js)
- [店长后台](/E:/炖时光/miniprogram/pages/admin/index.js)
- [后端启动脚本](/E:/炖时光/start-backend.ps1)

## 已推送仓库

[fioluuuna/chuntime-mini-program](https://github.com/fioluuuna/chuntime-mini-program)
