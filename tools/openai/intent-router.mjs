const IMAGE_KEYWORDS = [
  /生成图片/,
  /AI生成图片/i,
  /画一张图/,
  /画张图/,
  /画图/,
  /出图/,
  /做一张海报/,
  /做张海报/,
  /生成海报/,
  /生成主视觉/,
  /生成banner/i,
  /生成封面图/,
]

export function detectIntent(text = "") {
  const normalized = String(text || "").trim()
  if (!normalized) {
    return "default"
  }
  return IMAGE_KEYWORDS.some((pattern) => pattern.test(normalized)) ? "image" : "default"
}

export function resolveRoute(text = "") {
  const intent = detectIntent(text)
  if (intent === "image") {
    return {
      intent,
      keySource: "OPENAI_IMAGE_KEY",
      module: "tools/openai/request-router.mjs",
      note: "Image requests use the dedicated image key and image generation endpoint.",
    }
  }

  return {
    intent,
    keySource: "codex-default",
    module: "codex-app",
    note: "Normal chat and coding continue to use the existing Codex key managed by the app.",
  }
}

function main() {
  const prompt = process.argv.slice(2).join(" ")
  const route = resolveRoute(prompt)
  process.stdout.write(`${JSON.stringify(route, null, 2)}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
import { pathToFileURL } from "url"
