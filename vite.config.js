import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import busboy from 'busboy'
import fs from 'fs'
import os from 'os'
import path from 'path'
import FormData from 'form-data'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'edu-notebook-api',
      configureServer(server) {
        server.middlewares.use('/api/fetch-url', async (req, res) => {
          try {
            const urlParam = new URL(req.url, 'http://localhost').searchParams.get('url');
            if (!urlParam) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'URL gerekli' }));
              return;
            }
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000);
            const response = await fetch(urlParam, {
              signal: controller.signal,
              headers: {
                'user-agent': 'EduNotebookBot/1.0'
              }
            });
            clearTimeout(timeout);
            if (!response.ok) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'URL okunamadı' }));
              return;
            }
            const html = await response.text();
            const dom = new JSDOM(html, { url: urlParam });
            const reader = new Readability(dom.window.document);
            const article = reader.parse();
            const title = article?.title || dom.window.document.title || 'Web Kaynağı';
            const text = article?.textContent || dom.window.document.body?.textContent || '';
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ title, text: text.replace(/\s+\n/g, '\n').trim() }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'URL işleme hatası' }));
          }
        });

        server.middlewares.use('/api/transcribe', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'POST gerekli' }));
            return;
          }
          const apiKey = process.env.OPENAI_API_KEY || '';
          if (!apiKey) {
            res.statusCode = 501;
            res.end(JSON.stringify({ error: 'OPENAI_API_KEY ayarlanmadı' }));
            return;
          }
          const bb = busboy({ headers: req.headers });
          const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edu-audio-'));
          let tmpFile = null;
          let mimeType = 'application/octet-stream';
          bb.on('file', (name, file, info) => {
            mimeType = info.mimeType || mimeType;
            const filePath = path.join(tmpDir, info.filename || `audio-${Date.now()}`);
            tmpFile = filePath;
            const stream = fs.createWriteStream(filePath);
            file.pipe(stream);
          });
          bb.on('close', async () => {
            try {
              if (!tmpFile) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Dosya bulunamadı' }));
                return;
              }
              const form = new FormData();
              form.append('file', fs.createReadStream(tmpFile), {
                filename: path.basename(tmpFile),
                contentType: mimeType
              });
              form.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1');
              const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  ...form.getHeaders()
                },
                body: form
              });
              const json = await resp.json();
              if (!resp.ok) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: json?.error?.message || 'Transkript hatası' }));
                return;
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ text: json.text || '' }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Transkript hatası' }));
            } finally {
              try {
                if (tmpFile) fs.unlinkSync(tmpFile);
                fs.rmdirSync(tmpDir, { recursive: true });
              } catch {}
            }
          });
          req.pipe(bb);
        });
      }
    }
  ],
})
