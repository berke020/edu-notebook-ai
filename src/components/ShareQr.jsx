import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';

export default function ShareQr() {
  const { id } = useParams();
  const navigate = useNavigate();
  const url = useMemo(() => `${window.location.origin}/share/${id}`, [id]);
  const [qrUrl, setQrUrl] = useState('');
  const [viewCount, setViewCount] = useState(0);
  const [viewLog, setViewLog] = useState([]);

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 240 })
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [url]);

  useEffect(() => {
    const views = Number(localStorage.getItem(`share_${id}_views`) || 0);
    const log = JSON.parse(localStorage.getItem(`share_${id}_view_log`) || '[]');
    setViewCount(views);
    setViewLog(log);
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-[#E6E9EF]">
      <div className="p-6 rounded-2xl bg-[#111827] border border-white/10 text-center">
        <div className="text-sm mb-3">QR ile paylaş</div>
        {qrUrl ? (
          <img src={qrUrl} alt="QR" className="mx-auto rounded-xl border border-white/10" />
        ) : (
          <div className="w-[240px] h-[240px] rounded-xl border border-white/10 flex items-center justify-center text-xs text-white/60">
            QR oluşturuluyor...
          </div>
        )}
        <div className="text-[10px] text-white/60 mt-3 break-all">{url}</div>
        <div className="mt-4 text-[10px] text-white/60">
          Toplam görüntüleme: {viewCount}
        </div>
        {viewLog[0] && (
          <div className="mt-1 text-[10px] text-white/60">
            Son görüntüleme: {new Date(viewLog[0].ts).toLocaleString('tr-TR')}
          </div>
        )}
        <button onClick={() => navigate('/')} className="mt-4 px-3 py-2 rounded-lg bg-white/10 text-xs">
          Ana Sayfa
        </button>
      </div>
    </div>
  );
}
