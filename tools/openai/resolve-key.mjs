import { execFileSync } from "child_process"

function readWindowsUserEnvVar(name) {
  try {
    const output = execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `[System.Environment]::GetEnvironmentVariable('${name}','User')`,
      ],
      { encoding: "utf8" }
    )
    return String(output || "").trim()
  } catch (error) {
    return ""
  }
}

export function resolveOpenAIImageKey() {
  if (process.env.OPENAI_IMAGE_KEY) {
    return process.env.OPENAI_IMAGE_KEY
  }

  if (process.platform === "win32") {
    return readWindowsUserEnvVar("OPENAI_IMAGE_KEY")
  }

  return ""
}
