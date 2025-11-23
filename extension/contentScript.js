// contentScript.js
// Lightweight highlight saver with quote/prefix/suffix anchoring
// Stores highlights in chrome.storage.local as array under key 'highlights'

(function() {
  if (window.__highlightSaverInjected) return;
  window.__highlightSaverInjected = true;

  // Utils
  function makeId() { return 'h_' + Date.now() + '_' + Math.floor(Math.random()*10000); }

  function getSelectionRect() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0).cloneRange();
    const rects = range.getClientRects();
    if (!rects || rects.length === 0) return null;
    return rects[0];
  }

  function serializeSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const text = sel.toString().trim();
    if (!text) return null;

    const range = sel.getRangeAt(0);
    // Try to use nearest text node for prefix/suffix
    let node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) {
      // find nearest text node within range
      function findText(n) {
        if (!n) return null;
        if (n.nodeType === Node.TEXT_NODE) return n;
        for (let i=0;i<n.childNodes.length;i++){
          const found = findText(n.childNodes[i]);
          if (found) return found;
        }
        return null;
      }
      node = findText(range.commonAncestorContainer) || range.startContainer;
    }
    const full = (node && node.nodeValue) ? node.nodeValue : text;
    const quote = text;
    const idx = full.indexOf(quote);
    const prefix = idx > 0 ? full.slice(Math.max(0, idx - 30), idx) : full.slice(0, 30);
    const suffix = idx >= 0 ? full.slice(idx + quote.length, idx + quote.length + 30) : full.slice(-30);
    return { quote, prefix, suffix };
  }

  function findRangeForAnchor(quote, prefix, suffix) {
    // Walk text nodes and try to find a match
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.nodeValue || '';
      let index = -1;
      // If prefix provided, look for prefix+quote; else look for quote.
      if (prefix && prefix.length > 0) {
        index = text.indexOf(prefix + quote);
        if (index !== -1) {
          // index is start of prefix; quote starts at index + prefix.length
          const quoteStart = index + prefix.length;
          const range = document.createRange();
          range.setStart(node, quoteStart);
          range.setEnd(node, quoteStart + quote.length);
          return range;
        }
      }
      // fallback: find quote alone
      index = text.indexOf(quote);
      if (index !== -1) {
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + quote.length);
        return range;
      }
    }
    return null;
  }

  // Create bubble
  function createBubble() {
    const el = document.createElement('div');
    el.className = 'highlight-saver-bubble';
    el.textContent = 'Save Highlight?';
    el.style.display = 'none';
    el.style.position = 'absolute';
    el.style.cursor = 'pointer';
    document.body.appendChild(el);
    return el;
  }
  const bubble = createBubble();

  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (!text) {
        bubble.style.display = 'none';
        return;
      }
      const rect = getSelectionRect();
      if (!rect) {
        bubble.style.display = 'none';
        return;
      }
      bubble.style.left = (rect.left + window.scrollX) + 'px';
      bubble.style.top = (rect.top + window.scrollY - 38) + 'px';
      bubble.style.display = 'block';

      bubble.onclick = function() {
        const serialized = serializeSelection();
        if (!serialized) return;
        const highlight = {
          id: makeId(),
          url: location.href,
          quote: serialized.quote,
          prefix: serialized.prefix,
          suffix: serialized.suffix,
          createdAt: Date.now()
        };

        // try visual highlight
        try {
          const selRange = window.getSelection().getRangeAt(0);
          const span = document.createElement('span');
          span.className = 'highlighted-text';
          selRange.surroundContents(span);
        } catch (err) {
          // ignore; some ranges can't be surrounded
          console.warn('visual highlight failed', err);
        }

        chrome.storage.local.get({ highlights: [] }, (res) => {
          const highlights = res.highlights || [];
          highlights.unshift(highlight);
          chrome.storage.local.set({ highlights }, () => {
            bubble.style.display = 'none';
            window.getSelection().removeAllRanges();
            console.log('Highlight saved:', highlight);
          });
        });
      };
    }, 10);
  });

  document.addEventListener('mousedown', (e) => {
    if (!bubble.contains(e.target)) {
      setTimeout(() => bubble.style.display = 'none', 100);
    }
  });

  // Reapply highlights for current URL on load & DOMContent changes
  function reanchorHighlightsForCurrentPage() {
    chrome.storage.local.get({ highlights: [] }, (res) => {
      const highlights = (res.highlights || []).filter(h => h.url === location.href);
      highlights.forEach(h => {
        try {
          const r = findRangeForAnchor(h.quote, h.prefix, h.suffix);
          if (r) {
            const span = document.createElement('span');
            span.className = 'highlighted-text';
            try { r.surroundContents(span); } catch (_) {}
          }
        } catch (e) {
          console.warn('reanchoring error', e);
        }
      });
    });
  }

  // Run on load and on mutation (for SPAs)
  window.addEventListener('load', reanchorHighlightsForCurrentPage);
  new MutationObserver(() => {
    clearTimeout(window.__reanchorTimeout);
    window.__reanchorTimeout = setTimeout(reanchorHighlightsForCurrentPage, 500);
  }).observe(document.body, { childList: true, subtree: true });
})();
