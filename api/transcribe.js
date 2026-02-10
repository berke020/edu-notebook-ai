import busboy from 'busboy';
import fs from 'fs';
import os from 'os';
import path from 'path';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST gerekli' });
    return;
  }
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    res.status(501).json({ error: 'OPENAI_API_KEY ayarlanmadı' });
    return;
  }

  const bb = busboy({ headers: req.headers });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edu-audio-'));
  let tmpFile = null;
  let mimeType = 'application/octet-stream';

  bb.on('file', (_name, file, info) => {
    mimeType = info.mimeType || mimeType;
    const filePath = path.join(tmpDir, info.filename || `audio-${Date.now()}`);
    tmpFile = filePath;
    const stream = fs.createWriteStream(filePath);
    file.pipe(stream);
  });

  bb.on('close', async () => {
    try {
      if (!tmpFile) {
        res.status(400).json({ error: 'Dosya bulunamadı' });
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
        res.status(400).json({ error: json?.error?.message || 'Transkript hatası' });
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({ text: json.text || '' });
    } catch (err) {
      res.status(500).json({ error: 'Transkript hatası' });
    } finally {
      try {
        if (tmpFile) fs.unlinkSync(tmpFile);
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  });

  req.pipe(bb);
}
