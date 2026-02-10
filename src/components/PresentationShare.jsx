import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function PresentationShare() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const data = useMemo(() => {
    const raw = localStorage.getItem(`share_${id}`);
    return raw ? JSON.parse(raw) : null;
  }, [id]);
  const [pwd, setPwd] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-[#E6E9EF]">
        Paylaşım bulunamadı.
      </div>
    );
  }
  const viewKey = `share_${id}_views`;
  const [views, setViews] = useState(0);
  useEffect(() => {
    const current = Number(localStorage.getItem(viewKey) || 0) + 1;
    localStorage.setItem(viewKey, String(current));
    setViews(current);
  }, [viewKey]);
  if (data.expiresAt && Date.now() > data.expiresAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-[#E6E9EF]">
        Paylaşım süresi doldu.
      </div>
    );
  }
  if (data.password && !unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-[#E6E9EF]">
        <div className="p-6 rounded-2xl bg-[#111827] border border-white/10 w-full max-w-sm">
          <div className="text-sm mb-3">Bu sunum parola korumalı.</div>
          <input
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Parola"
            className="w-full px-3 py-2 rounded-xl bg-[#0B0F14] border border-white/10 text-sm mb-3"
          />
          <button
            onClick={() => setUnlocked(pwd === data.password)}
            className="w-full px-3 py-2 rounded-xl bg-[#F5B84B] text-[#1b1b1b] text-sm font-semibold"
          >
            Aç
          </button>
        </div>
      </div>
    );
  }

  const slide = data.slides[index];

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6E9EF] flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="text-sm">{data.title || 'Sunum'}</div>
        <div className="text-xs text-white/60">Görüntülenme: {views}</div>
        <button onClick={() => navigate('/')} className="text-xs px-3 py-2 rounded-lg bg-white/10">Ana Sayfa</button>
      </div>
      <div className="flex-1 flex items-center justify-center px-8">
        <div className={`max-w-3xl w-full transition-all duration-300 ${data.transition === 'slide' ? 'translate-x-0' : 'opacity-100'}`}>
          <div className="text-2xl font-bold mb-4">{index + 1}. {slide?.title}</div>
          {data.layout === 'split' ? (
            <div className="grid grid-cols-2 gap-6">
              <ul className="space-y-2 text-sm text-white/80">
                {(slide?.bullets || []).map((b, i) => (<li key={i}>• {b}</li>))}
              </ul>
              <div className="text-xs text-white/60">{slide?.visual || 'Görsel alanı'}</div>
            </div>
          ) : data.layout === 'visual' ? (
            <div>
              <div className="mb-4 text-xs text-white/60">Görsel: {slide?.visual || 'Görsel alanı'}</div>
              <ul className="space-y-2 text-sm text-white/80">
                {(slide?.bullets || []).map((b, i) => (<li key={i}>• {b}</li>))}
              </ul>
            </div>
          ) : (
            <ul className="space-y-2 text-sm text-white/80">
              {(slide?.bullets || []).map((b, i) => (<li key={i}>• {b}</li>))}
            </ul>
          )}
        </div>
      </div>
      <div className="px-6 py-4 flex items-center justify-between border-t border-white/10 text-xs">
        <button onClick={() => setIndex(i => Math.max(0, i - 1))} className="px-3 py-2 rounded-lg bg-white/10">Önceki</button>
        <div>{index + 1} / {data.slides.length}</div>
        <button onClick={() => setIndex(i => Math.min(data.slides.length - 1, i + 1))} className="px-3 py-2 rounded-lg bg-white/10">Sonraki</button>
      </div>
    </div>
  );
}
