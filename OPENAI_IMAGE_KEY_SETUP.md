# OpenAI Key Routing

这个仓库现在已经补了一套“图像请求单独走图像 Key”的逻辑。

## 先说边界

- 普通聊天、代码生成、日常 Codex 使用：
  - 继续走你现在 Codex App 自己管理的默认 Key
  - 这个仓库里的代码不会去改它
- 图像生成：
  - 单独读取 `OPENAI_IMAGE_KEY`
  - 不会影响普通聊天 Key

也就是说：

- `Codex` 的聊天认证层，还是 `Codex` 自己管
- 仓库里新增的是“图像生成模块的独立 Key 路由”

## 你需要做的唯一配置

在 Windows 用户环境变量里新增：

- 变量名：`OPENAI_IMAGE_KEY`
- 变量值：你的 OpenAI 图像专用 Key

建议同时可选新增：

- `OPENAI_IMAGE_MODEL`
  - 默认值可不填
  - 当前脚本默认会使用 `gpt-image-2`

配置完成后：

1. 关闭当前终端
2. 重新打开终端或重新打开 Codex
3. 再执行下面的检查命令

## 检查图像 Key 是否可用

```powershell
node .\tools\openai\check-image-key.mjs
```

如果成功，会返回类似：

```json
{
  "ok": true,
  "model": "gpt-image-2"
}
```

## 路由逻辑

图像意图关键词目前包含：

- `生成图片`
- `AI生成图片`
- `画一张图`
- `画图`
- `出图`
- `生成海报`
- `生成主视觉`
- `生成banner`
- `生成封面图`

对应文件：

- [intent-router.mjs](/E:/炖时光/tools/openai/intent-router.mjs)
- [request-router.mjs](/E:/炖时光/tools/openai/request-router.mjs)

## 试运行路由判断

```powershell
node .\tools\openai\intent-router.mjs "帮我生成图片，做一张炖汤海报"
```

如果命中图片意图，会返回：

```json
{
  "intent": "image",
  "keySource": "OPENAI_IMAGE_KEY"
}
```

## 真正执行图片生成

```powershell
node .\tools\openai\request-router.mjs --prompt "帮我生成图片，做一张温暖的炖汤首页横幅"
```

也可以指定输出路径：

```powershell
node .\tools\openai\request-router.mjs --prompt "生成图片：暖色中式炖汤横幅" --out ".\\output\\imagegen\\home-hero.png"
```

## 结果保存位置

默认输出到：

- `output/imagegen/`

这个目录已经加入 `.gitignore`，不会被误提交。

## 为什么不建议把 Key 写死进仓库

你前面提到“写死在配置文件里”。

技术上可以，但我不建议这么做，因为：

- 容易误提交到 GitHub
- 后面更换 Key 麻烦
- 风险比环境变量大很多

所以现在给你做的是更稳妥的版本：

- 聊天 Key：保持原样
- 图像 Key：独立环境变量 `OPENAI_IMAGE_KEY`

## 官方参考

- OpenAI 图像生成总览：[Image generation guide](https://platform.openai.com/docs/guides/image-generation)
- OpenAI Images API 参考：[Images API reference](https://platform.openai.com/docs/api-reference/images)
- OpenAI API key 基础说明：[Quickstart](https://platform.openai.com/docs/quickstart)
