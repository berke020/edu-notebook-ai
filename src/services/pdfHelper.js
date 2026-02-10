import * as pdfjsLib from 'pdfjs-dist';

// CDN yerine, yüklü paketin içindeki worker dosyasını "url" olarak import ediyoruz.
// Vite sonundaki '?url' takısını görünce bunun dosya yolunu bize verir.
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Worker kaynağını yerel dosyamıza eşitliyoruz
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const extractTextFromPDF = async (file) => {
  try {
    // Dosyayı ArrayBuffer'a çevir
    const arrayBuffer = await file.arrayBuffer();
    
    // PDF'i yükle
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";

    // Her sayfayı tek tek gez ve yazıları al
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Sayfadaki kelimeleri birleştir
      const pageText = textContent.items.map(item => item.str).join(' ');
      
      // Sayfa sonuna işaret koy
      fullText += `--- Sayfa ${i} ---\n${pageText}\n\n`;
    }

    return { success: true, text: fullText, pageCount: pdf.numPages };
  } catch (error) {
    console.error("PDF Okuma Hatası:", error);
    return { success: false, error: error.message };
  }
};