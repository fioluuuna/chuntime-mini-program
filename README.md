# 炖时光微信小程序

炖时光的微信小程序与本地后端项目。

## 当前能力

- 顾客端：首页、菜单、套餐组合、购物车、订单、会员、付款页
- 店长端：隐藏入口后台、订单管理、菜品库存、耗材库存、日报统计
- 支付流程：线上点单，线下扫码付款，店长手动确认收款
- 素材：路线图、菜品图、门店收款码

## 目录结构

- `miniprogram/`：微信小程序前端
- `backend/`：本地 Node 后端
- `miniprogram/assets/images/`：当前小程序实际使用的图片素材
- `tools/openai/`：图像专用 Key 路由与图片生成脚本

## 本地运行

### 1. 启动后端

```powershell
.\start-backend.ps1
```

健康检查地址：

```text
http://127.0.0.1:3007/api/health
```

### 2. 打开小程序

用微信开发者工具导入根目录里的 [project.config.json](/E:/炖时光/project.config.json)。

- `miniprogramRoot` 已配置为 `miniprogram/`
- 当前接口直连本机 `127.0.0.1:3007`

## 图像专用 Key 路由

这个仓库已经加了“图像请求单独走图像 Key”的逻辑：

- 普通聊天和代码生成：保持 Codex App 当前默认 Key，不改
- 图像生成：单独读取 `OPENAI_IMAGE_KEY`

详细说明看：

- [OPENAI_IMAGE_KEY_SETUP.md](/E:/炖时光/OPENAI_IMAGE_KEY_SETUP.md)

## 关键文件

- [后端服务](/E:/炖时光/backend/server.js)
- [后端初始数据](/E:/炖时光/backend/lib/seed.js)
- [接口封装](/E:/炖时光/miniprogram/utils/api.js)
- [本地状态](/E:/炖时光/miniprogram/utils/state.js)
- [首页](/E:/炖时光/miniprogram/pages/home/index.js)
- [菜单页](/E:/炖时光/miniprogram/pages/menu/index.js)
- [订单页](/E:/炖时光/miniprogram/pages/order/index.js)
- [店长后台](/E:/炖时光/miniprogram/pages/admin/index.js)
- [图像意图路由](/E:/炖时光/tools/openai/intent-router.mjs)
- [图像请求入口](/E:/炖时光/tools/openai/request-router.mjs)

## 仓库

[fioluuuna/chuntime-mini-program](https://github.com/fioluuuna/chuntime-mini-program)
