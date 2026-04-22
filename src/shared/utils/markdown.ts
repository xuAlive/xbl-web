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

const renderInlineMarkdown = (content: string) => {
  const escaped = escapeHtml(content)
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

export const renderPlainMarkdown = (content: string) => {
  const lines = (content || '').replace(/\r\n/g, '\n').split('\n')
  const htmlBlocks: string[] = []
  let paragraphLines: string[] = []
  let listItems: string[] = []
  let listTag: 'ul' | 'ol' | '' = ''
  let inCodeBlock = false
  let codeLines: string[] = []

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return
    }
    htmlBlocks.push(`<p>${renderInlineMarkdown(paragraphLines.join('<br>'))}</p>`)
    paragraphLines = []
  }

  const flushList = () => {
    if (!listTag || listItems.length === 0) {
      listItems = []
      listTag = ''
      return
    }
    htmlBlocks.push(`<${listTag}>${listItems.join('')}</${listTag}>`)
    listItems = []
    listTag = ''
  }

  const flushCodeBlock = () => {
    if (!inCodeBlock) {
      return
    }
    htmlBlocks.push(`<pre class="hljs"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
    inCodeBlock = false
    codeLines = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      flushParagraph()
      flushList()
      if (inCodeBlock) {
        flushCodeBlock()
      } else {
        inCodeBlock = true
        codeLines = []
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(rawLine)
      continue
    }

    if (!trimmed) {
      flushParagraph()
      flushList()
      continue
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed)
    if (headingMatch) {
      flushParagraph()
      flushList()
      const level = headingMatch[1].length
      htmlBlocks.push(`<h${level}>${renderInlineMarkdown(headingMatch[2].trim())}</h${level}>`)
      continue
    }

    const unorderedMatch = /^[-*+]\s+(.+)$/.exec(trimmed)
    if (unorderedMatch) {
      flushParagraph()
      if (listTag && listTag !== 'ul') {
        flushList()
      }
      listTag = 'ul'
      listItems.push(`<li>${renderInlineMarkdown(unorderedMatch[1].trim())}</li>`)
      continue
    }

    const orderedMatch = /^\d+\.\s+(.+)$/.exec(trimmed)
    if (orderedMatch) {
      flushParagraph()
      if (listTag && listTag !== 'ol') {
        flushList()
      }
      listTag = 'ol'
      listItems.push(`<li>${renderInlineMarkdown(orderedMatch[1].trim())}</li>`)
      continue
    }

    if (listTag) {
      flushList()
    }
    paragraphLines.push(trimmed)
  }

  flushParagraph()
  flushList()
  flushCodeBlock()

  return htmlBlocks.join('')
}

const createRenderer = async (options: MarkdownOptions): Promise<MarkdownRenderer> => {
  try {
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
      ]) : Promise.resolve(null)
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
  } catch {
    return {
      render(content: string) {
        return renderPlainMarkdown(content)
      },
    }
  }
}

export const loadMarkdownRenderer = (options: MarkdownOptions = {}): Promise<MarkdownRenderer> => {
  if (options.codeHighlight) {
    highlightRendererPromise ??= createRenderer({ codeHighlight: true })
    return highlightRendererPromise
  }

  basicRendererPromise ??= createRenderer({ codeHighlight: false })
  return basicRendererPromise
}
