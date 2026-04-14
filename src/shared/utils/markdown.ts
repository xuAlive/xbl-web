export interface MarkdownRenderer {
  render(content: string): string
}

interface MarkdownOptions {
  codeHighlight?: boolean
}

type MarkdownItModule = typeof import('markdown-it')
type HighlightJsModule = typeof import('highlight.js/lib/core')
type HighlightJsLanguageModule = { default: any }
type HighlightJsApi = HighlightJsModule['default']

let basicRendererPromise: Promise<MarkdownRenderer> | null = null
let highlightRendererPromise: Promise<MarkdownRenderer> | null = null

const escapeHtml = (content: string) =>
  content
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export const renderPlainMarkdown = (content: string) => {
  return `<p>${escapeHtml(content).replaceAll('\n', '<br>')}</p>`
}

const createRenderer = async (options: MarkdownOptions): Promise<MarkdownRenderer> => {
  const modules = await Promise.all([
    import('markdown-it'),
    options.codeHighlight ? import('highlight.js/lib/core') : Promise.resolve(null),
    options.codeHighlight ? Promise.all([
      import('highlight.js/lib/languages/javascript'),
      import('highlight.js/lib/languages/typescript'),
      import('highlight.js/lib/languages/json'),
      import('highlight.js/lib/languages/bash'),
      import('highlight.js/lib/languages/java'),
      import('highlight.js/lib/languages/xml'),
      import('highlight.js/lib/languages/css'),
      import('highlight.js/lib/languages/scss'),
      import('highlight.js/lib/languages/sql'),
      import('highlight.js/lib/languages/python'),
      import('highlight.js/lib/languages/yaml')
    ]) : Promise.resolve(null),
    options.codeHighlight ? import('highlight.js/styles/github-dark.css') : Promise.resolve(null)
  ])
  const markdownItModule = modules[0] as MarkdownItModule
  const highlightJsModule = modules[1] as HighlightJsModule | null
  const highlightLanguages = modules[2] as HighlightJsLanguageModule[] | null
  const MarkdownIt = markdownItModule.default
  const hljs = highlightJsModule?.default ?? null

  if (hljs && highlightLanguages) {
    const languageEntries: Array<[string, HighlightJsLanguageModule | undefined]> = [
      ['javascript', highlightLanguages[0]],
      ['js', highlightLanguages[0]],
      ['typescript', highlightLanguages[1]],
      ['ts', highlightLanguages[1]],
      ['json', highlightLanguages[2]],
      ['bash', highlightLanguages[3]],
      ['shell', highlightLanguages[3]],
      ['sh', highlightLanguages[3]],
      ['java', highlightLanguages[4]],
      ['html', highlightLanguages[5]],
      ['xml', highlightLanguages[5]],
      ['vue', highlightLanguages[5]],
      ['css', highlightLanguages[6]],
      ['scss', highlightLanguages[7]],
      ['sql', highlightLanguages[8]],
      ['python', highlightLanguages[9]],
      ['py', highlightLanguages[9]],
      ['yaml', highlightLanguages[10]],
      ['yml', highlightLanguages[10]]
    ]

    languageEntries.forEach(([name, language]) => {
      if (language && !hljs.getLanguage(name)) {
        hljs.registerLanguage(name, language.default)
      }
    })
  }

  if (options.codeHighlight && hljs) {
    const renderer = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight(str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
          } catch {
            return `<pre class="hljs"><code>${renderer.utils.escapeHtml(str)}</code></pre>`
          }
        }
        return `<pre class="hljs"><code>${renderer.utils.escapeHtml(str)}</code></pre>`
      }
    })
    return renderer
  }

  return new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  })
}

export const loadMarkdownRenderer = (options: MarkdownOptions = {}): Promise<MarkdownRenderer> => {
  if (options.codeHighlight) {
    highlightRendererPromise ??= createRenderer({ codeHighlight: true })
    return highlightRendererPromise
  }

  basicRendererPromise ??= createRenderer({ codeHighlight: false })
  return basicRendererPromise
}
