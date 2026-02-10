import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'GET gerekli' });
    return;
  }
  try {
    const urlParam = new URL(req.url, 'http://localhost').searchParams.get('url');
    if (!urlParam) {
      res.status(400).json({ error: 'URL gerekli' });
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(urlParam, {
      signal: controller.signal,
      headers: { 'user-agent': 'EduNotebookBot/1.0' }
    });
    clearTimeout(timeout);
    if (!response.ok) {
      res.status(400).json({ error: 'URL okunamadı' });
      return;
    }
    const html = await response.text();
    const dom = new JSDOM(html, { url: urlParam });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    const title = article?.title || dom.window.document.title || 'Web Kaynağı';
    const text = article?.textContent || dom.window.document.body?.textContent || '';
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ title, text: text.replace(/\s+\n/g, '\n').trim() });
  } catch (err) {
    res.status(500).json({ error: 'URL işleme hatası' });
  }
}
