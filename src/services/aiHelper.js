import { supabase } from './supabaseClient';
import { apiCall } from './api';

/**
 * Metni vektöre (embedding) çevirir ve Supabase'e kaydeder.
 * @param {string} docId - Supabase'deki documents tablosu ID'si
 * @param {string} text - PDF'ten çıkan ham metin
 */
export const processDocumentForRAG = async (docId, text) => {
  try {
    // 1. Metni parçalara böl (Chunking)
    const chunks = splitTextIntoChunks(text, 1000); // 1000 karakterlik parçalar
    console.log(`${chunks.length} parçaya bölündü.`);

    for (const chunk of chunks) {
      // 2. Her parça için vektör oluştur (Google Gemini Embedding)
      // DÜZELTME BURADA: "models/" önekini kaldırdık.
      const response = await apiCall(
        'embedContent', 
        {
          model: "text-embedding-004", 
          content: { parts: [{ text: chunk }] }
        },
        'text-embedding-004' // Model adı
      );

      const embedding = response.embedding.values;

      // 3. Vektörü ve metni veritabanına kaydet
      const { error } = await supabase
        .from('document_sections')
        .insert({
          document_id: docId,
          content: chunk,
          embedding: embedding
        });

      if (error) console.error("Supabase Kayıt Hatası:", error);
    }
    
    console.log(`İşlem Tamam: ${chunks.length}/${chunks.length} parça vektörleştirildi.`);
    return true;

  } catch (error) {
    console.error("RAG İşleme Hatası:", error);
    return false;
  }
};

/**
 * Kullanıcı sorusuna en uygun içeriği bulur (Semantic Search)
 */
export const searchRelevantContent = async (userQuery, docIds = null) => {
  try {
    // 1. Soruyu Vektöre Çevir
    // DÜZELTME BURADA: "models/" önekini kaldırdık.
    const response = await apiCall(
      'embedContent', 
      {
        model: "text-embedding-004",
        content: { parts: [{ text: userQuery }] }
      },
      'text-embedding-004'
    );
    const queryEmbedding = response.embedding.values;

    // 2. Supabase'de Benzerlik Araması Yap (RPC Çağrısı)
    const { data: matchedDocuments, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5, // %50 ve üzeri benzerlik
      match_count: 5 // En alakalı 5 parçayı getir
    });

    if (error) {
      console.error("Arama Hatası:", error);
      return null;
    }

    // 3. Bulunan parçaları tek bir metin haline getir
    if (!matchedDocuments || matchedDocuments.length === 0) return null;

    let filtered = matchedDocuments;
    if (docIds && docIds.length > 0) {
      // Eğer RPC document_id döndürüyorsa filtrele
      if (matchedDocuments[0]?.document_id !== undefined) {
        filtered = matchedDocuments.filter(d => docIds.includes(d.document_id));
      }
    }
    if (!filtered || filtered.length === 0) return null;
    
    const contextText = filtered.map(doc => doc.content).join("\n\n---\n\n");
    return contextText;

  } catch (error) {
    console.error("RAG Arama Hatası:", error);
    return null;
  }
};

/**
 * Metni belirli uzunlukta parçalara böler.
 */
function splitTextIntoChunks(text, chunkSize) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Sadece geçerli oturuma (sessionId) ait içerikleri çeker.
 */
export const fetchBroadContext = async (options) => {
  try {
    let sessionId = null;
    let docIds = null;
    if (typeof options === 'string' || typeof options === 'number') {
      sessionId = options;
    } else if (options && typeof options === 'object') {
      sessionId = options.sessionId || null;
      docIds = options.docIds || null;
    }

    if (!sessionId && (!docIds || docIds.length === 0)) return null;

    // 1. Önce bu sohbete ait dokümanların ID'lerini bul (docIds verilmediyse)
    if (!docIds || docIds.length === 0) {
      const { data: docs, error: docError } = await supabase
        .from('documents')
        .select('id')
        .eq('session_id', sessionId);

      if (docError || !docs || docs.length === 0) {
        console.log("Bu oturumda veritabanına kayıtlı dosya yok.");
        return null;
      }
      docIds = docs.map(d => d.id);
    }

    // 2. Sadece bu ID'lere sahip dokümanların içeriğini getir
    const { data, error } = await supabase
      .from('document_sections')
      .select('content')
      .in('document_id', docIds) 
      .limit(25); 

    if (error || !data || data.length === 0) return null;

    return data.map(d => d.content).join("\n\n---\n\n");
  } catch (error) {
    console.error("Geniş Bağlam Hatası:", error);
    return null;
  }
};
