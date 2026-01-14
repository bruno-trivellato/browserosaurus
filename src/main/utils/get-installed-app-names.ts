import { execSync } from 'node:child_process'
import path from 'node:path'

import { sleep } from 'tings'

import { apps } from '../../config/apps.js'
import { retrievedInstalledApps, startedScanning } from '../state/actions.js'
import { dispatch } from '../state/store.js'
import { getUrlCapableAppNames } from './get-url-capable-apps.js'

function getAllInstalledAppNames(): string[] {
  const appNames = execSync(
    'find ~/Applications /Applications -iname "*.app" -prune -not -path "*/.*" 2>/dev/null ||true',
  )
    .toString()
    .trim()
    .split('\n')
    .map((appPath) => path.parse(appPath).name)

  return appNames
}

async function getInstalledAppNames(): Promise<void> {
  dispatch(startedScanning())

  const allInstalledAppNames = getAllInstalledAppNames()

  // Get hardcoded apps that are installed
  const installedHardcodedApps = Object.keys(apps).filter((appName) =>
    allInstalledAppNames.includes(appName),
  )

  // Get dynamically discovered URL-capable apps
  const urlCapableApps = getUrlCapableAppNames()

  // Merge both lists, removing duplicates (hardcoded apps take precedence)
  const allApps = [...new Set([...installedHardcodedApps, ...urlCapableApps])]

  // It appears that sometimes the installed app IDs are not fetched, maybe a
  // race with Spotlight index? So if none found, keep retrying.
  // TODO is this needed any more, now using we're `find` method?
  // https://github.com/will-stone/browserosaurus/issues/425
  if (allApps.length === 0) {
    await sleep(500)
    getInstalledAppNames()
  } else {
    dispatch(retrievedInstalledApps(allApps))
  }
}

export { getInstalledAppNames }
