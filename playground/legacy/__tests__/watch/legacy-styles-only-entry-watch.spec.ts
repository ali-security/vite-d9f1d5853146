import { expect, test } from 'vitest'
import {
  editFile,
  findAssetFile,
  isBuild,
  notifyRebuildComplete,
  readManifest,
  watcher,
} from '~utils'

test.runIf(isBuild)('rebuilds styles only entry on change', async () => {
  expect(findAssetFile(/style-only-entry-.+\.css/, 'watch')).toContain(
    '#ff69b4',
  )
  expect(findAssetFile(/style-only-entry-legacy-.+\.js/, 'watch')).toContain(
    '#ff69b4',
  )
  expect(findAssetFile(/polyfills-legacy-.+\.js/, 'watch')).toBeTruthy()
  const numberOfManifestEntries = Object.keys(readManifest('watch')).length
  expect(numberOfManifestEntries).toBe(3)

  editFile('style-only-entry.css', (originalContents) =>
    originalContents.replace('#ff69b4', '#ffb6c1'),
  )
  await notifyRebuildComplete(watcher)

  const updatedManifest = readManifest('watch')
  expect(Object.keys(updatedManifest)).toHaveLength(numberOfManifestEntries)

  // We must use the file referenced in the manifest here,
  // since there'll be different versions of the file with different hashes.
  // The rebuilt assets aren't necessarily flushed to disk by the time the
  // rebuild is reported as complete, so re-read the manifest and the asset it
  // points at until the updated contents show up.
  const readAssetFromManifest = (name: string) =>
    findAssetFile(
      readManifest('watch')[name]!.file.substring('assets/'.length),
      'watch',
    )
  await expect
    .poll(() => readAssetFromManifest('style-only-entry.css'), {
      timeout: 10000,
    })
    .toContain('#ffb6c1')
  await expect
    .poll(() => readAssetFromManifest('style-only-entry-legacy.css'), {
      timeout: 10000,
    })
    .toContain('#ffb6c1')
  expect(findAssetFile(/polyfills-legacy-.+\.js/, 'watch')).toBeTruthy()
})
