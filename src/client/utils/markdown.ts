import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import type { TocItem } from '~/types'

let md: MarkdownIt | null = null

/**
 * 初始化 markdown-it 实例
 */
function getMd(): MarkdownIt {
  if (md) return md

  md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false,
    breaks: false,
    highlight(str: string, lang: string): string {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
      try {
        const highlighted = hljs.highlight(str, { language, ignoreIllegals: true }).value
        const langLabel = lang || 'code'
        return `<div class="code-block-wrapper"><div class="code-block-header"><span class="code-lang">${langLabel}</span><button class="code-copy-btn" type="button">复制</button></div><pre class="hljs"><code class="hljs language-${language}">${highlighted}</code></pre></div>`
      } catch {
        return `<pre class="hljs"><code>${md!.utils.escapeHtml(str)}</code></pre>`
      }
    }
  })

  // 为标题添加 id
  const originalRender = md.renderer.rules.heading_open || function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options)
  }

  md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx]
    const level = token.tag === 'h1' ? 1 : token.tag === 'h2' ? 2 : token.tag === 'h3' ? 3 : token.tag === 'h4' ? 4 : token.tag === 'h5' ? 5 : 6
    const nextToken = tokens[idx + 1]
    if (nextToken && nextToken.type === 'inline') {
      const text = nextToken.content
      const id = slugify(text)
      // 记录 TOC
      if (level >= 1 && level <= 3 && env) {
        if (!env.toc) env.toc = []
        env.toc.push({ id, text, level })
      }
      token.attrSet('id', id)
      token.attrSet('data-level', String(level))
    }
    return originalRender.call(this, tokens, idx, options, env, self)
  }

  // 外链安全
  const defaultLinkOpen = md.renderer.rules.link_open || function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options)
  }
  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    const aIndex = tokens[idx].attrIndex('target')
    if (aIndex < 0) {
      tokens[idx].attrPush(['target', '_blank'])
      tokens[idx].attrPush(['rel', 'noopener noreferrer'])
    } else {
      tokens[idx].attrs![aIndex][1] = '_blank'
    }
    return defaultLinkOpen.call(this, tokens, idx, options, env, self)
  }

  return md
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\.,;:!?'"`(){}\[\]<>\/\\|@#$%^&*+=~]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    || 'heading-' + Math.random().toString(36).slice(2, 8)
}

export interface MarkdownResult {
  html: string
  toc: TocItem[]
}

/**
 * 渲染 Markdown，返回 HTML 与 TOC
 */
export function renderMarkdown(content: string): MarkdownResult {
  const instance = getMd()
  const env: { toc?: TocItem[] } = {}
  const html = instance.render(content, env)
  return {
    html,
    toc: env.toc || []
  }
}

/**
 * 仅渲染 Markdown 为 HTML（不生成 TOC）
 */
export function renderMarkdownHtml(content: string): string {
  return getMd().render(content)
}

export default getMd
