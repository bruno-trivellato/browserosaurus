import { execFile } from 'node:child_process'

import type { AppName, KnownAppName } from '../../config/apps.js'
import { apps } from '../../config/apps.js'

type AppConfig = {
  privateArg?: string
  convertUrl?: (url: string) => string
}

export function openApp(
  appName: AppName,
  url: string,
  isAlt: boolean,
  isShift: boolean,
): void {
  // Check if this is a known app with special configuration
  const isKnownApp = appName in apps
  const selectedApp: AppConfig | null = isKnownApp
    ? apps[appName as KnownAppName]
    : null

  const convertedUrl =
    selectedApp?.convertUrl ? selectedApp.convertUrl(url) : url

  const openArguments: string[] = [
    '-a',
    appName,
    isAlt ? '--background' : [],
    isShift && selectedApp?.privateArg
      ? ['--new', '--args', selectedApp.privateArg]
      : [],
    // In order for private/incognito mode to work the URL needs to be passed
    // in last, _after_ the respective app.privateArg flag
    convertedUrl,
  ]
    .filter(Boolean)
    .flat()

  execFile('open', openArguments)
}
