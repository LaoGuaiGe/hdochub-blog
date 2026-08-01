// Markdown 渲染 + XSS 过滤
// 文章正文用 marked 渲染，再用 xss 过滤危险标签
// 评论仅允许基础 Markdown（加粗、代码、链接）
import { marked } from 'marked';
import * as xss from 'xss';
import { Logger } from '@nestjs/common';

const logger = new Logger('Markdown');

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: false,
});

// XSS 过滤白名单：允许常见 HTML 标签，禁用 script/iframe 等
const xssOptions: xss.IFilterXSSOptions = {
  whiteList: {
    a: ['href', 'title', 'target', 'rel'],
    abbr: ['title'],
    address: [],
    article: [],
    aside: [],
    b: [],
    blockquote: ['cite'],
    br: [],
    caption: [],
    code: ['class'],
    col: ['span', 'width'],
    colgroup: ['span', 'width'],
    dd: [],
    del: [],
    details: ['open'],
    div: ['class'],
    dl: [],
    dt: [],
    em: [],
    figcaption: [],
    figure: [],
    h1: ['id'],
    h2: ['id'],
    h3: ['id'],
    h4: ['id'],
    h5: ['id'],
    h6: ['id'],
    hr: [],
    i: [],
    img: ['src', 'alt', 'title', 'width', 'height'],
    ins: [],
    kbd: [],
    li: [],
    mark: [],
    ol: ['start', 'type'],
    p: [],
    pre: ['class'],
    q: ['cite'],
    s: [],
    section: [],
    small: [],
    span: ['class'],
    strong: [],
    sub: [],
    summary: [],
    sup: [],
    table: ['width', 'border', 'cellpadding', 'cellspacing'],
    tbody: [],
    td: ['colspan', 'rowspan', 'width'],
    tfoot: [],
    th: ['colspan', 'rowspan', 'width'],
    thead: [],
    tr: [],
    ul: [],
    time: ['datetime'],
  },
  // 对链接做安全处理：禁止 javascript: 协议
  onTagAttr: (tag, name, value) => {
    if (name === 'href' || name === 'src') {
      if (/^\s*javascript:/i.test(value) || /^\s*vbscript:/i.test(value)) {
        return '';
      }
    }
    return undefined;
  },
  // 对 <a> 标签强制加 rel=noreferrer noopener
  onTag: (tag, html) => {
    if (tag === 'a') {
      return html.replace('<a ', '<a rel="noopener noreferrer" target="_blank" ');
    }
    return undefined;
  },
};

const xssFilter = new xss.FilterXSS(xssOptions);

// 渲染文章 Markdown 为 HTML 并过滤 XSS
export function renderMarkdown(content: string): string {
  if (!content) return '';
  try {
    const html = marked.parse(content, { async: false }) as string;
    return xssFilter.process(html);
  } catch (e) {
    logger.error(`Markdown 渲染失败: ${e.message}`);
    return xssFilter.process(content);
  }
}

// 渲染评论 Markdown（限制更严格的语法）
export function renderCommentHtml(content: string): string {
  if (!content) return '';
  try {
    const html = marked.parse(content, { async: false }) as string;
    return xssFilter.process(html);
  } catch (e) {
    logger.error(`评论 Markdown 渲染失败: ${e.message}`);
    return xssFilter.process(content);
  }
}

// 转义 HTML（纯文本展示时）
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 高亮搜索关键词（包裹 <em>）
export function highlightKeyword(text: string, keyword: string): string {
  if (!text || !keyword) return text;
  const escaped = escapeHtml(text);
  const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${safeKeyword})`, 'gi');
  return escaped.replace(regex, '<em>$1</em>');
}
