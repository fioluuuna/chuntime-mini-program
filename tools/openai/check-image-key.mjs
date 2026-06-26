import { resolveOpenAIImageKey } from "./resolve-key.mjs"

async function main() {
  const apiKey = resolveOpenAIImageKey()
  if (!apiKey) {
    throw new Error("Missing OPENAI_IMAGE_KEY.")
  }

  const response = await fetch("https://api.openai.com/v1/models/gpt-image-2", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  const rawText = await response.text()
  let data
  try {
    data = JSON.parse(rawText)
  } catch (error) {
    throw new Error(`Image key check returned a non-JSON response: ${rawText.slice(0, 240)}`)
  }

  if (!response.ok) {
    throw new Error(`Image key check failed (${response.status}): ${data?.error?.message || rawText}`)
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        model: data.id,
        ownedBy: data.owned_by,
      },
      null,
      2
    )}\n`
  )
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
