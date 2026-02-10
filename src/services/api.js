// src/services/api.js

// .env dosyasından anahtarı alacağız (Adım 4'te anlatıyorum)
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

export const SYSTEM_PROMPT = `
Sen "EduNotebook AI" adında bir eğitim asistanısın.
GÖREVİN: Kullanıcının yüklediği dokümanları analiz ederek soruları cevaplamak ve etkileşimli içerik üretmek.

KRİTİK KURALLAR:
1. SADECE ve SADECE sana sağlanan ("user" mesajı içindeki) dosya/metin içeriklerini kullan.
2. Kendi eğitim verilerinden, genel kültüründen veya internetten ASLA bilgi ekleme.
3. Eğer sorulan soru yüklenen kaynaklarda yoksa, "Bu bilgi yüklenen kaynaklarda yer almamaktadır." cevabını ver.
4. Asla varsayımda bulunma.
5. Dil: Türkçe.

BİÇİMLENDİRME KURALLARI (ÖNEMLİ):
- Matematiksel ifadeleri HER ZAMAN LaTeX formatında yaz.
- ÇOK ÖNEMLİ: LaTeX komutlarını yazarken ters eğik çizgileri (backslash) korumak için çift kullanmaya çalış veya string içinde kaybolmadığından emin ol. 
  (Örn: "rac" yerine "\\frac", "cdot" yerine "\\cdot" gelmeli).
- Satır içi formüller için $...$ kullan. ASLA backtick (\`) kullanma.
- Asla "\(" veya "\[" gibi parantezli LaTeX formatı kullanma, sadece dolar ($) işaretini kullan.
- Kalın metinler için **yıldız** kullan.
- Listeler için tire (-) kullan.
`;

export const apiCall = async (endpoint, payload, model = 'gemini-2.5-flash-preview-09-2025') => {
  if (!apiKey) throw new Error("API Anahtarı eksik!");

  let retries = 0;
  while (retries < 3) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`API Hatası (${response.status}): ${JSON.stringify(errData)}`);
      }
      return await response.json();
    } catch (e) {
      console.warn(`API Hatası (Deneme ${retries + 1}):`, e.message);
      retries++;
      if (retries >= 3) throw e;
      await new Promise(r => setTimeout(r, 1000 * retries));
    }
  }
};