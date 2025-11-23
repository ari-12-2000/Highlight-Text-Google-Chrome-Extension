
document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('list');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const summaryBox = document.getElementById('summaryBox');
  const summaryText = document.getElementById('summaryText');
  const BASE_URL= 'https://highlight-text-google-chrome-extension.onrender.com'

  function renderList(items) {
    if (!items || items.length === 0) {
      listEl.innerHTML = '<div>No highlights saved yet.</div>';
      return;
    }
    listEl.innerHTML = '';
    items.forEach(h => {
      const item = document.createElement('div');
      item.className = 'item';
      const quote = document.createElement('div');
      quote.textContent = h.quote.length > 300 ? h.quote.slice(0,300) + '...' : h.quote;
      const meta = document.createElement('div');
      meta.className = 'meta';
      try { meta.textContent = `${new URL(h.url).hostname} • ${new Date(h.createdAt).toLocaleString()}`; } catch(e) { meta.textContent = h.url; }
      const actions = document.createElement('div');
      actions.className = 'actions';
      const copyBtn = document.createElement('button'); copyBtn.textContent = 'Copy'; copyBtn.onclick = () => navigator.clipboard.writeText(h.quote);
      const delBtn = document.createElement('button'); delBtn.textContent = 'Delete'; delBtn.onclick = () => remove(h.id);
      const openBtn = document.createElement('button'); openBtn.textContent = 'Open'; openBtn.onclick = () => window.open(h.url, '_blank');
      actions.append(copyBtn, delBtn, openBtn);
      item.append(quote, meta, actions);
      listEl.appendChild(item);
    });
  }

  function load() {
    chrome.storage.local.get({ highlights: [] }, (res) => {
      renderList(res.highlights || []);
    });
  }

  function remove(id) {
    chrome.storage.local.get({ highlights: [] }, (res) => {
      const hs = (res.highlights || []).filter(h => h.id !== id);
      chrome.storage.local.set({ highlights: hs }, load);
    });
  }

  clearAllBtn.addEventListener('click', () => {
    if (!confirm('Clear all saved highlights?')) return;
    chrome.storage.local.set({ highlights: [] }, load);
    summaryBox.style.display = 'none';
  });

  summarizeBtn.addEventListener('click', async () => {
    chrome.storage.local.get({ highlights: [] }, async (res) => {
      const hs = res.highlights || [];
      if (!hs.length) { alert('No highlights to summarize'); return; }
      summarizeBtn.disabled = true;
      summarizeBtn.textContent = 'Summarizing...';
      try {
        // Change URL to your server if different
        const resp = await fetch(`${BASE_URL}/api/summarize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: hs.map(h => h.quote) })
        });
        const data = await resp.json();
        summaryText.textContent = data.summary || 'No summary';
        summaryBox.style.display = 'block';
      } catch (e) {
        console.log('Error contacting server',e)
        alert('Failed to contact summary server');
      } finally {
        summarizeBtn.disabled = false;
        summarizeBtn.textContent = 'Summarize (server)';
      }
    });
  });

  // initial load
  load();

  // listen for storage changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.highlights) {
      renderList(changes.highlights.newValue || []);
    }
  });
});
