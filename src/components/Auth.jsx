import React, { useState } from 'react';
import { BookOpen, Mail, Lock, User, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [info, setInfo] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPasswordHelp, setShowPasswordHelp] = useState(false);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  React.useEffect(() => {
    const leadName = localStorage.getItem('lead_name') || '';
    const leadEmail = localStorage.getItem('lead_email') || '';
    if (leadName && !fullName) setFullName(leadName);
    if (leadEmail && !email) setEmail(leadEmail);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    setResetEmailSent(false);
    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setInfo('Kayıt alındı. E-postanı doğrulayıp giriş yapmalısın.');
          setMode('login');
        } else {
          onAuthed?.();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onAuthed?.();
      }
    } catch (e2) {
      const msg = e2?.message || 'Giriş yapılamadı.';
      if (msg.includes('Too Many Requests')) {
        setError('Çok fazla deneme yapıldı. 60 sn bekleyip tekrar deneyin.');
        setCooldown(60);
      } else if (msg.toLowerCase().includes('invalid login')) {
        setError('E-posta veya şifre hatalı.');
      } else if (msg.toLowerCase().includes('user already registered')) {
        setError('Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.');
        setMode('login');
      } else if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('confirmation')) {
        setError('E-postanı doğrulamalısın. Doğrulama sonrası giriş yapabilirsin.');
      } else {
        setError('Bir sorun oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError('');
    setInfo('');
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email
    });
    if (resendError) setError('Doğrulama e-postası gönderilemedi.');
    else setInfo('Doğrulama e-postası tekrar gönderildi.');
  };

  const handleResetPassword = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`
      });
      if (resetError) throw resetError;
      setResetEmailSent(true);
      setInfo('Şifre yenileme linki e-postana gönderildi.');
    } catch {
      setError('Şifre sıfırlama linki gönderilemedi. E-postanı kontrol et.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider) => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/app`
        }
      });
      if (oauthError) throw oauthError;
    } catch {
      setError('Sosyal giriş başlatılamadı. Lütfen tekrar dene.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen text-[#E6E9EF]"
      style={{
        backgroundColor: '#0B0F14',
        backgroundImage:
          'radial-gradient(1200px circle at 10% 0%, rgba(245, 184, 75, 0.10), transparent 40%), radial-gradient(900px circle at 90% 0%, rgba(122, 162, 255, 0.14), transparent 40%), linear-gradient(180deg, #0B0F14 0%, #0E141B 100%)',
        fontFamily: '"Space Grotesk", "Sora", sans-serif'
      }}
    >
      <div className="min-h-screen max-w-[1100px] mx-auto grid grid-cols-12 gap-8 items-center px-6 py-10">
        <div className="col-span-12 lg:col-span-6">
          <div className="flex items-center gap-2 text-[#F5B84B] font-bold text-xl mb-6" style={{ fontFamily: '"Fraunces", serif' }}>
            <BookOpen size={26} /> EduNotebook
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Kaynak odaklı öğrenme için tek platform.
          </h1>
          <p className="text-sm text-[#9AA4B2] mb-8 max-w-md">
            Yalnızca yüklediğin kaynaklarla çalışan akıllı çalışma odası. Özet, quiz, kavram haritası ve daha fazlası.
          </p>
          <div className="grid gap-3">
            {[
              { icon: ShieldCheck, title: 'Kaynak Güvenliği', text: 'Model dışarıdan bilgi çekmez.' },
              { icon: Sparkles, title: 'Kişisel Profil', text: 'Hedefler, streak ve odak alanları.' },
              { icon: Zap, title: 'Etkileşim Araçları', text: 'Tek tıkla özet ve quiz üret.' }
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-4 rounded-2xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)]">
                <item.icon size={18} className="text-[#F5B84B]" />
                <div>
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="text-xs text-[#9AA4B2]">{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <div className="w-full p-8 rounded-3xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2]">HESAP</div>
                <h2 className="text-2xl font-bold mt-2">{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</h2>
              </div>
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-xs px-3 py-2 rounded-xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)] text-[#9AA4B2]"
              >
                {mode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)]">
                  <User size={16} className="text-[#9AA4B2]" />
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad Soyad" className="bg-transparent text-sm outline-none w-full" />
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)]">
                <Mail size={16} className="text-[#9AA4B2]" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta" className="bg-transparent text-sm outline-none w-full" />
              </div>
              <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)]">
                <Lock size={16} className="text-[#9AA4B2]" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifre" className="bg-transparent text-sm outline-none w-full" />
              </div>
              {mode === 'register' && (
                <div className="text-[10px] text-[#9AA4B2]">
                  Şifre en az 8 karakter olmalı. Harf + sayı önerilir.
                </div>
              )}
              {mode === 'login' && (
                <div className="flex items-center justify-between text-[10px] text-[#9AA4B2]">
                  <button type="button" onClick={() => setShowPasswordHelp(prev => !prev)} className="hover:text-white">
                    Şifre şartları
                  </button>
                  <button type="button" onClick={handleResetPassword} className="hover:text-white" disabled={loading}>
                    Şifremi unuttum
                  </button>
                </div>
              )}
              {showPasswordHelp && (
                <div className="text-[10px] text-[#9AA4B2]">
                  Güvenlik için en az 8 karakter, harf + sayı + özel karakter öneriyoruz.
                </div>
              )}
              {info && <div className="text-xs text-emerald-400">{info}</div>}
              {error && <div className="text-xs text-red-400">{error}</div>}
              <button disabled={loading || cooldown > 0} className="w-full px-4 py-3 rounded-2xl bg-[#F5B84B] text-[#1b1b1b] font-semibold disabled:opacity-60">
                {loading ? 'Bekleyin...' : (cooldown > 0 ? `Tekrar dene (${cooldown}s)` : (mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'))}
              </button>
            </form>

            <div className="mt-4">
              <div className="text-[10px] tracking-[0.3em] text-[#9AA4B2] mb-3">SOSYAL GİRİŞ</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => handleSocial('google')}
                  className="px-4 py-3 rounded-2xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)] text-sm hover:text-white"
                  disabled={loading}
                >
                  Google ile devam et
                </button>
                <button
                  onClick={() => handleSocial('apple')}
                  className="px-4 py-3 rounded-2xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)] text-sm hover:text-white"
                  disabled={loading}
                >
                  Apple ile devam et
                </button>
              </div>
              <div className="text-[10px] text-[#9AA4B2] mt-3">
                Sosyal giriş için Supabase OAuth sağlayıcılarını etkinleştirmen gerekir.
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)] text-[10px] text-[#9AA4B2]">
              {mode === 'register'
                ? 'Kayıt sonrası e-posta doğrulaması yapılır. Doğruladıktan sonra giriş yapabilirsin.'
                : 'Giriş sonrası otomatik olarak çalışma odana yönlendirilirsin.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
