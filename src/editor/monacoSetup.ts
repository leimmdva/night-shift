/**
 * monacoSetup.ts — the slimmest Monaco that still highlights JavaScript.
 *
 * - `edcore.main` is the editor core without the bundled language services (no TypeScript, JSON, CSS or HTML
 *   workers, no autocomplete that could solve a puzzle).
 * - Only the JavaScript tokenizer (syntax highlighting, runs on the main thread) is added.
 * - The one worker Monaco always wants (editor worker, used for diffs and word lookups) is created here, so there
 *   is no "Could not create web worker(s)" warning and no request for /undefined.
 */
import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

;(self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
}

export default monaco
