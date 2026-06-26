import fs from "fs"
import path from "path"
import { resolveRoute } from "./intent-router.mjs"

const DEFAULT_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2"
const DEFAULT_IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE || "1536x1024"
const DEFAULT_IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY || "high"

function parseArgs(argv) {
  const args = {
    prompt: "",
    out: "",
    size: DEFAULT_IMAGE_SIZE,
    quality: DEFAULT_IMAGE_QUALITY,
    dryRun: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i]
    if (current === "--prompt") {
      args.prompt = argv[i + 1] || ""
      i += 1
      continue
    }
    if (current === "--out") {
      args.out = argv[i + 1] || ""
      i += 1
      continue
    }
    if (current === "--size") {
      args.size = argv[i + 1] || args.size
      i += 1
      continue
    }
    if (current === "--quality") {
      args.quality = argv[i + 1] || args.quality
      i += 1
      continue
    }
    if (current === "--dry-run") {
      args.dryRun = true
      continue
    }
  }

  return args
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
}

function buildOutputPath(explicitPath = "") {
  if (explicitPath) {
    return path.resolve(explicitPath)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  return path.resolve("output", "imagegen", `generated-${timestamp}.png`)
}

async function generateImage({ prompt, out, size, quality, dryRun }) {
  const outputPath = buildOutputPath(out)
  const payload = {
    model: DEFAULT_IMAGE_MODEL,
    prompt,
    size,
    quality,
  }

  if (dryRun) {
    process.stdout.write(`${JSON.stringify({ mode: "image", outputPath, payload }, null, 2)}\n`)
    return
  }

  const apiKey = process.env.OPENAI_IMAGE_KEY
  if (!apiKey) {
    throw new Error("Missing OPENAI_IMAGE_KEY. Please set a dedicated image key before generating images.")
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  const rawText = await response.text()
  let data
  try {
    data = JSON.parse(rawText)
  } catch (error) {
    throw new Error(`Image API returned a non-JSON response: ${rawText.slice(0, 240)}`)
  }

  if (!response.ok) {
    throw new Error(`Image API failed (${response.status}): ${data?.error?.message || rawText}`)
  }

  const imageBase64 = data?.data?.[0]?.b64_json
  if (!imageBase64) {
    throw new Error("Image API returned successfully, but no image payload was found.")
  }

  ensureDir(outputPath)
  fs.writeFileSync(outputPath, Buffer.from(imageBase64, "base64"))

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: "image",
        model: payload.model,
        outputPath,
      },
      null,
      2
    )}\n`
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.prompt) {
    throw new Error("Please provide a prompt with --prompt.")
  }

  const route = resolveRoute(args.prompt)
  if (route.intent !== "image") {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: "default",
          note: "This prompt does not match image intent keywords, so it stays on the normal Codex path.",
          route,
        },
        null,
        2
      )}\n`
    )
    return
  }

  await generateImage(args)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
