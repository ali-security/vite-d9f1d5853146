import path from 'node:path'
import type { Connect } from '#dep-types/connect'
import { isWindows } from '../../../shared/utils'

// `launch-editor` strips a trailing `:line[:column]` position suffix off the
// requested file before opening it, so strip it the same way before validating.
const filePositionSuffixRE = /:\d+(?::\d+)?$/

/**
 * Windows resolves a path starting with `\\` (or `//`) as a UNC path pointing
 * at a remote SMB share. Opening one in an editor makes Windows authenticate
 * against whoever serves that share, leaking credentials, so such paths are
 * not supported.
 */
export function isWindowsUNCPath(file: string): boolean {
  const fileName = file.replace(filePositionSuffixRE, '')
  return path.win32.resolve(fileName).startsWith('\\\\')
}

/**
 * Rejects `/__open-in-editor` requests for UNC paths before `launch-editor`
 * hands them to the editor.
 */
export function openInEditorGuardMiddleware(): Connect.NextHandleFunction {
  // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
  return function viteOpenInEditorGuardMiddleware(req, res, next) {
    if (!isWindows) return next()

    const file = new URL(req.url!, 'http://localhost').searchParams.get('file')
    if (file && isWindowsUNCPath(file)) {
      res.writeHead(403)
      res.end()
      return
    }
    return next()
  }
}
