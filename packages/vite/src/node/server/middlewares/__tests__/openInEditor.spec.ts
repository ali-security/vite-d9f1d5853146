import { describe, expect, test } from 'vitest'
import { isWindowsUNCPath } from '../openInEditor'

describe('isWindowsUNCPath', () => {
  const uncPaths = [
    '\\\\server\\share\\file.js',
    '//server/share/file.js',
    // the position suffix `launch-editor` strips must not hide the UNC path
    '\\\\server\\share\\file.js:10:5',
    '\\\\server\\share\\file.js:10',
    '//server/share/file.js:10:5',
  ]
  for (const file of uncPaths) {
    test(`denies ${JSON.stringify(file)}`, () => {
      expect(isWindowsUNCPath(file)).toBe(true)
    })
  }

  const normalPaths = [
    'C:\\Users\\me\\file.js',
    'C:/Users/me/file.js',
    'C:\\Users\\me\\file.js:10:5',
    'src/main.ts',
    'src\\main.ts',
    '/home/me/file.js',
    // a lone leading slash is not a UNC path
    '/server/share/file.js',
  ]
  for (const file of normalPaths) {
    test(`allows ${JSON.stringify(file)}`, () => {
      expect(isWindowsUNCPath(file)).toBe(false)
    })
  }
})
