/* Shared, offline Markdown presentation. Never expands filesystem read access. */
(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cache = new Map();
  let cacheSize = 0;
  const renderer = {
    // Treat embedded HTML as text, including scripts and event handlers in logs.
    html({ text }) { return escape(text); },
    image({ text }) { return `<span class="md-image">▧ ${escape(text || '图片')}<small>图片不自动加载</small></span>`; },
    link({ href, title, tokens }) {
      const label = this.parser.parseInline(tokens);
      // No file://, javascript:, data:, protocol-relative or relative navigation.
      // A document reference is not an authenticated Observer API route.
      if (!/^https?:\/\/[^\s]+$/i.test(href) || /[\u0000-\u0020\u007f]/.test(href)) return `<span class="md-reference" title="${escape(href)}">${label}</span>`;
      return `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer"${title ? ` title="${escape(title)}"` : ''}>${label}</a>`;
    },
    checkbox({ checked }) { return `<span class="md-check" role="img" aria-label="${checked ? '已完成' : '未完成'}">${checked ? '☑' : '☐'}</span>`; },
  };
  const parser = new marked.Marked({ gfm: true, breaks: false, renderer });
  const policy = {
    ALLOWED_TAGS: ['p','br','hr','h1','h2','h3','h4','h5','h6','strong','em','del','blockquote','ul','ol','li','pre','code','table','thead','tbody','tr','th','td','a','span','small'],
    ALLOWED_ATTR: ['href','title','target','rel','class','start','align','role','aria-label'],
    ALLOW_DATA_ATTR: false,
    RETURN_DOM_FRAGMENT: true,
  };
  function render(text, { frontmatter = false } = {}) {
    const source = String(text ?? '');
    const key = `${frontmatter ? 'file:' : 'text:'}${source}`;
    if (cache.has(key)) return cache.get(key);
    let body = source, metadata = '';
    if (frontmatter) {
      const match = body.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/);
      if (match) {
        body = body.slice(match[0].length);
        let fingerprint = 2166136261;
        for (let i = 0; i < source.length; i++) fingerprint = Math.imul(fingerprint ^ source.charCodeAt(i), 16777619);
        const expand = `markdown-metadata:${fingerprint >>> 0}`;
        metadata = `<details class="md-frontmatter" data-expand="${expand}"><summary data-expand="${expand}">文档属性</summary><pre>${escape(match[1])}</pre></details>`;
      }
    }
    let result;
    try {
      const fragment = DOMPurify.sanitize(parser.parse(body), policy);
      // Wide tables scroll inside the document, never stretch the application.
      fragment.querySelectorAll('table').forEach(table => {
        const wrapper = document.createElement('div');
        wrapper.className = 'md-table'; wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'region'); wrapper.setAttribute('aria-label', '文档表格，可横向滚动');
        table.replaceWith(wrapper); wrapper.append(table);
      });
      const holder = document.createElement('div'); holder.append(fragment);
      result = metadata + holder.innerHTML;
    } catch {
      // A parser failure must preserve readable content, never inject raw HTML.
      result = `<p class="md-fallback">${escape(source)}</p>`;
    }
    const bytes = 2 * (key.length + result.length);
    if (bytes <= 2 * 1024 * 1024) {
      while (cache.size && (cache.size >= 80 || cacheSize + bytes > 2 * 1024 * 1024)) {
        const oldest = cache.keys().next().value;
        cacheSize -= 2 * (oldest.length + cache.get(oldest).length); cache.delete(oldest);
      }
      cache.set(key, result); cacheSize += bytes;
    }
    return result;
  }
  window.ObserverMarkdown = Object.freeze({ render });
})();
