import { execSync } from 'node:child_process'
import path from 'node:path'

/**
 * Checks if an app can handle http/https URLs by reading its Info.plist
 */
function canAppHandleUrls(appPath: string): boolean {
  try {
    // Use defaults to read CFBundleURLTypes from the app's Info.plist
    const plistPath = path.join(appPath, 'Contents', 'Info.plist')
    const result = execSync(
      `defaults read "${plistPath}" CFBundleURLTypes 2>/dev/null || echo "[]"`,
    ).toString()

    // Check if the app handles http or https schemes
    // The output format can vary, so we check for common patterns:
    // - "http" or 'http' (quoted)
    // - http, or http\n (unquoted, followed by comma or newline)
    // - (http) in array notation
    const lowerResult = result.toLowerCase()
    return (
      /["'(,\s]https?["'),\s\n]/iu.test(result) ||
      lowerResult.includes('"http"') ||
      lowerResult.includes("'http'") ||
      /\bhttps?\b/u.test(lowerResult)
    )
  } catch {
    return false
  }
}

/**
 * Gets all installed app paths from Applications folders
 */
function getAllAppPaths(): string[] {
  const appPaths = execSync(
    'find ~/Applications /Applications -maxdepth 2 -iname "*.app" -prune -not -path "*/.*" 2>/dev/null || true',
  )
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean)

  return appPaths
}

/**
 * Discovers all apps that can handle http/https URLs (browsers and URL-capable apps)
 * Returns an array of app names (without .app extension)
 */
function getUrlCapableAppNames(): string[] {
  const appPaths = getAllAppPaths()
  const urlCapableApps: string[] = []

  for (const appPath of appPaths) {
    if (canAppHandleUrls(appPath)) {
      const appName = path.parse(appPath).name
      urlCapableApps.push(appName)
    }
  }

  return urlCapableApps
}

export { getUrlCapableAppNames }
