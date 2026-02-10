import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, CheckCircle, Zap, Shield, Sparkles, GraduationCap, Users, Briefcase, Layers, Cpu, Wand2, Building2, BadgeCheck, XCircle } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const features = [
    { title: 'Sadece Yüklenen Kaynaklar', desc: 'Model dışarıdan bilgi çekmez. Sadece sizin yüklediğiniz dosyalarla çalışır.', icon: Shield },
    { title: 'Etkileşimli Öğrenim', desc: 'Özet, quiz, kavram haritası, mnemonik ve daha fazlası tek panelde.', icon: Zap },
    { title: 'Kategoriye Göre Akış', desc: 'İlkokul, lise, üniversite, jüri, tez, toplantı için özel araçlar.', icon: Sparkles }
  ];

  const useCases = [
    { title: 'Lise / YKS', desc: 'Test odaklı çalışma, ezber listeleri ve hızlı quiz akışları.', icon: GraduationCap },
    { title: 'Üniversite', desc: 'Akademik özet, makale taslağı ve derin analiz.', icon: Briefcase },
    { title: 'Jüri / Tez', desc: 'Savunma modları, agresif soru simülasyonu ve rol-play.', icon: Users }
  ];

  const plans = [
    { name: 'BASIC', price: 'Ücretsiz', desc: 'Yeni başlayanlar için temel kullanım.', items: ['Sınırlı günlük etkileşim', 'Temel özet / quiz', 'Topluluk notları'] },
    { name: 'PRO', price: '₺249 / ay', desc: 'Yoğun çalışma yapanlar için.', items: ['Sınırsız etkileşim', 'Gelişmiş araçlar', 'Öncelikli işlem', 'Kişisel profil'], annual: '₺199 / ay (yıllık)' },
    { name: 'TEAM', price: '₺999 / ay', desc: 'Okul / ekipler için ortak çalışma.', items: ['Paylaşımlı projeler', 'Yönetici paneli', 'Özel entegrasyonlar'], annual: '₺799 / ay (yıllık)' }
  ];

  const faqs = [
    { q: 'Kaynak dışında cevap verir mi?', a: 'Hayır. Sistem sadece yüklediğiniz içeriklerle çalışır.' },
    { q: 'Hangi dosyalar yüklenebilir?', a: 'PDF, DOCX, TXT, görsel, ses, video ve web URL desteklenir. Ayrıca kopyalanan metni kaynak olarak ekleyebilirsin.' },
    { q: 'Kategori değiştirebilir miyim?', a: 'Evet, her proje odasında kategoriye göre araçlar güncellenir.' },
    { q: 'Jüri ve tez modlarında nasıl çalışır?', a: 'Kişiselleştirilebilir persona ve savunma senaryolarıyla çalışır.' }
  ];

  const mockupSvg = (
    <svg viewBox="0 0 640 420" className="w-full h-auto">
      <defs>
        <linearGradient id="panel" x1="0" x2="1">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="accent" x1="0" x2="1">
          <stop offset="0%" stopColor="#F5B84B" />
          <stop offset="100%" stopColor="#7AA2FF" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="640" height="420" rx="24" fill="#0B0F14" stroke="#20283A" />
      <rect x="24" y="24" width="180" height="372" rx="16" fill="url(#panel)" stroke="#1F2937" />
      <rect x="220" y="24" width="396" height="260" rx="16" fill="url(#panel)" stroke="#1F2937" />
      <rect x="220" y="296" width="396" height="100" rx="16" fill="url(#panel)" stroke="#1F2937" />
      <rect x="36" y="44" width="120" height="12" rx="6" fill="#334155" />
      <rect x="36" y="72" width="150" height="10" rx="6" fill="#1E293B" />
      <rect x="36" y="100" width="150" height="10" rx="6" fill="#1E293B" />
      <rect x="36" y="128" width="150" height="10" rx="6" fill="#1E293B" />
      <rect x="236" y="44" width="220" height="14" rx="6" fill="url(#accent)" />
      <rect x="236" y="72" width="320" height="10" rx="6" fill="#1E293B" />
      <rect x="236" y="92" width="280" height="10" rx="6" fill="#1E293B" />
      <rect x="236" y="130" width="340" height="84" rx="12" fill="#0F172A" stroke="#1F2937" />
      <rect x="236" y="230" width="340" height="12" rx="6" fill="#1E293B" />
      <circle cx="260" cy="336" r="16" fill="#1F2937" />
      <rect x="286" y="328" width="240" height="12" rx="6" fill="#1E293B" />
      <rect x="286" y="348" width="200" height="10" rx="6" fill="#111827" />
      <rect x="520" y="330" width="72" height="28" rx="12" fill="#F5B84B" />
    </svg>
  );

  return (
    <div
      className="min-h-screen text-[#E6E9EF]"
      style={{
        backgroundColor: '#0B0F14',
        backgroundImage:
          'radial-gradient(1200px circle at 12% 8%, rgba(245, 184, 75, 0.10), transparent 42%), radial-gradient(900px circle at 88% 0%, rgba(122, 162, 255, 0.14), transparent 35%), linear-gradient(180deg, #0B0F14 0%, #0E141B 100%)',
        fontFamily: '"Space Grotesk", "Sora", sans-serif'
      }}
    >
      <header className="px-6 py-6 flex items-center justify-between max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 text-[#F5B84B] font-bold text-xl" style={{ fontFamily: '"Fraunces", serif' }}>
          <BookOpen size={26} />
          EduNotebook
        </div>
        <div className="flex items-center gap-3">
          <a href="#pricing" className="text-sm text-[#9AA4B2] hover:text-white">Ücretlendirme</a>
          <a href="#faq" className="text-sm text-[#9AA4B2] hover:text-white">S.S.S</a>
          <a href="/auth" className="px-4 py-2 rounded-xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)] text-sm">Giriş / Kayıt</a>
        </div>
      </header>

      <main className="px-6 pb-16 max-w-[1200px] mx-auto">
        <section className="grid grid-cols-12 gap-8 items-center py-12">
          <div className="col-span-12 lg:col-span-7">
            <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-4">EĞİTİM YOLDAŞI</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
              Sadece sizin kaynaklarınızla çalışan yapay zeka çalışma odası.
            </h1>
            <p className="text-sm text-[#9AA4B2] mb-6 max-w-2xl">
              EduNotebook; özet, quiz, kavram haritası ve özel öğrenme modlarını tek panelde birleştirir.
              İnternet araştırması yapmaz, yalnızca yüklediğiniz kaynakları kullanır.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/auth" className="px-6 py-3 rounded-2xl bg-[#F5B84B] text-[#1b1b1b] font-semibold flex items-center gap-2 hover:brightness-110">
                Hemen Başla <ArrowRight size={18} />
              </a>
              <a href="#features" className="px-6 py-3 rounded-2xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)] text-sm">
                Özelliklere Bak
              </a>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <div className="p-6 rounded-3xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)]">
              <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-4">AKIŞ</div>
              <ol className="space-y-3 text-sm text-[#9AA4B2] mb-6">
                <li className="flex items-start gap-3"><CheckCircle size={16} className="text-[#F5B84B]" /> Kaynağını yükle (PDF, DOCX, TXT, görsel, ses, video, URL).</li>
                <li className="flex items-start gap-3"><CheckCircle size={16} className="text-[#F5B84B]" /> Sadece seçtiğin kaynaklarla çalış.</li>
                <li className="flex items-start gap-3"><CheckCircle size={16} className="text-[#F5B84B]" /> Özet, quiz, analiz üret.</li>
              </ol>
              <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden bg-[#0B0F14]">
                {mockupSvg}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-10">
          <div className="grid grid-cols-12 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="col-span-12 md:col-span-4 p-6 rounded-3xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)]">
                  <Icon size={20} className="text-[#F5B84B]" />
                  <div className="text-lg font-semibold mt-3">{f.title}</div>
                  <div className="text-sm text-[#9AA4B2] mt-2">{f.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="py-10">
          <div className="grid grid-cols-12 gap-6 items-center">
            <div className="col-span-12 lg:col-span-6">
              <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-4">ÜRÜN GÖRÜNÜMÜ</div>
              <h2 className="text-2xl font-semibold mb-3">Gerçek çalışma alanını gör.</h2>
              <p className="text-sm text-[#9AA4B2] mb-6">
                Aşağıdaki görsel uygulamanın gerçek çalışma düzenini temsil eder. İstersen bunu kendi ekran görüntünle değiştirebilirsin.
              </p>
              <a href="/auth" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5B84B] text-[#1b1b1b] text-sm font-semibold">
                Uygulamayı Aç <ArrowRight size={14} />
              </a>
            </div>
            <div className="col-span-12 lg:col-span-6">
              <div className="p-4 rounded-3xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)]">
                <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden bg-[#0B0F14]">
                  {mockupSvg}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-4">MİNİ ÜRÜN TURU</div>
          <div className="grid grid-cols-12 gap-6">
            {[
              { title: '1. Kaynağını Yükle', desc: 'PDF, DOCX, TXT, görsel, ses, video veya web URL ekle. Sadece seçtiğin kaynaklar kullanılacak.' },
              { title: '2. Araç Seç', desc: 'Özet, quiz, kavram haritası veya savunma modu ile içerik üret.' },
              { title: '3. Kaydet & Devam Et', desc: 'Etkileşim geçmişinden aynı çıktıya tekrar eriş.' }
            ].map((step, i) => (
              <div key={step.title} className="col-span-12 md:col-span-4 p-6 rounded-3xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)]">
                <div className="text-[10px] text-[#9AA4B2]">ADIM {i + 1}</div>
                <div className="text-lg font-semibold mt-2">{step.title}</div>
                <div className="text-sm text-[#9AA4B2] mt-2">{step.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-4">EDUNOTEBOOK VS DİĞER YAPAY ZEKA ARAÇLARI</div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 p-6 rounded-3xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)]">
              <div className="grid grid-cols-12 gap-4 text-xs">
                <div className="col-span-4 text-[#9AA4B2]">Özellik</div>
                <div className="col-span-4 text-[#9AA4B2]">EduNotebook</div>
                <div className="col-span-4 text-[#9AA4B2]">Diğer Yapay Zeka Araçları</div>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  { label: 'Kaynak Odaklı Yanıt', edu: 'Sadece yüklenen kaynaklar', other: 'Genel bilgi + kaynak belirsiz' },
                  { label: 'Etkileşim Araçları', edu: 'Özet, quiz, mnemonik, savunma', other: 'Genel sohbet' },
                  { label: 'Çalışma Odası', edu: 'Proje odaları + geçmiş', other: 'Sohbet geçmişi sınırlı' },
                  { label: 'Kategoriye Özel Mod', edu: 'İlkokul, lise, üniversite, jüri', other: 'Kitleye özel değil' },
                  { label: 'Kişisel Profil', edu: 'Hedef, hedef saat, pomodoro', other: 'Profil yok / sınırlı' }
                ].map((row) => (
                  <div key={row.label} className="grid grid-cols-12 gap-4 p-3 rounded-2xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)]">
                    <div className="col-span-4 text-[#9AA4B2] flex items-center gap-2">
                      <Shield size={14} className="text-[#7AA2FF]" />
                      {row.label}
                    </div>
                    <div className="col-span-4 text-[#F5B84B] flex items-center gap-2">
                      <BadgeCheck size={14} className="text-[#F5B84B]" />
                      {row.edu}
                    </div>
                    <div className="col-span-4 text-[#9AA4B2] flex items-center gap-2">
                      <XCircle size={14} className="text-[#F87171]" />
                      {row.other}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="grid grid-cols-12 gap-6 items-center">
            <div className="col-span-12 lg:col-span-6 p-6 rounded-3xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2 text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-4">
                <Building2 size={14} className="text-[#6EE7B7]" /> KURUMLAR İÇİN
              </div>
              <div className="text-2xl font-semibold mb-3">Okullar ve ekipler için kurumsal lisans.</div>
              <div className="text-sm text-[#9AA4B2] mb-5">
                Sınıf bazlı yönetim, rol bazlı izinler, ortak içerik havuzu ve kurum raporları ile EduNotebook’u kurum içi kullanın.
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs px-3 py-2 rounded-full bg-[rgba(110,231,183,0.12)] border border-[rgba(110,231,183,0.25)]">Kurumsal Panel</span>
                <span className="text-xs px-3 py-2 rounded-full bg-[rgba(122,162,255,0.12)] border border-[rgba(122,162,255,0.25)]">Sınıf Yönetimi</span>
                <span className="text-xs px-3 py-2 rounded-full bg-[rgba(245,184,75,0.12)] border border-[rgba(245,184,75,0.25)]">Raporlama</span>
              </div>
              <a href="/auth" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5B84B] text-[#1b1b1b] text-sm font-semibold">
                Kurumsal Demo İste <ArrowRight size={14} />
              </a>
            </div>
            <div className="col-span-12 lg:col-span-6 grid grid-cols-2 gap-4">
              {[
                { title: 'Sınıf Bazlı Kontrol', desc: 'Öğrenci gruplarını yönet.', icon: Users },
                { title: 'Rol Bazlı İzinler', desc: 'Öğretmen / öğrenci / yönetici.', icon: Shield },
                { title: 'Toplu Raporlar', desc: 'Başarı ve kullanım metrikleri.', icon: Sparkles },
                { title: 'Özel Entegrasyon', desc: 'LMS / okul sistemi bağlantıları.', icon: Cpu }
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-2xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)]">
                  <item.icon size={16} className="text-[#6EE7B7]" />
                  <div className="text-sm font-semibold mt-2">{item.title}</div>
                  <div className="text-xs text-[#9AA4B2] mt-2">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-4">KULLANICI YORUMLARI</div>
          <div className="grid grid-cols-12 gap-6">
            {[
              { name: 'Zehra · Lise', quote: 'YKS için quiz ve özet kısmı inanılmaz hızlandırdı.' },
              { name: 'Mert · Üniversite', quote: 'Makale taslağı ve akademik özet modları tam aradığım şeydi.' },
              { name: 'Selin · Tez', quote: 'Savunma soruları sayesinde jüriye hazırlandım.' }
            ].map((t) => (
              <div key={t.name} className="col-span-12 md:col-span-4 p-6 rounded-3xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)]">
                <div className="text-sm text-[#9AA4B2]">“{t.quote}”</div>
                <div className="text-xs text-[#6EE7B7] mt-3">{t.name}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-6 p-6 rounded-3xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)]">
              <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-3">NEDEN FARKLI?</div>
              <div className="text-2xl font-semibold mb-3">Kaynak doğruluğu + öğrenme araçları.</div>
              <div className="text-sm text-[#9AA4B2]">
                EduNotebook internetten bilgi çekmez; sadece yüklenen kaynaklara bağlı kalır. Bu sayede sınav odaklı,
                doğrulanabilir ve sürdürülebilir bir öğrenme düzeni sunar.
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="text-xs px-3 py-2 rounded-full bg-[rgba(245,184,75,0.12)] border border-[rgba(245,184,75,0.25)]">Kaynak Odaklı</span>
                <span className="text-xs px-3 py-2 rounded-full bg-[rgba(122,162,255,0.12)] border border-[rgba(122,162,255,0.25)]">Kişiselleştirilebilir</span>
                <span className="text-xs px-3 py-2 rounded-full bg-[rgba(110,231,183,0.12)] border border-[rgba(110,231,183,0.25)]">Etkileşimli</span>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6 grid grid-cols-2 gap-4">
              {[
                { title: 'Kaynak Seçimi', desc: 'Sadece seçtiğin dosyalar kullanılır.', icon: Layers },
                { title: 'Akıllı Modlar', desc: 'Feynman, Sokratik Hoca, Mnemonik.', icon: Wand2 },
                { title: 'Takip & Seri', desc: 'Streak ve başarı grafiği.', icon: Sparkles },
                { title: 'Hızlı Çıktı', desc: 'Tek tıkla özet, quiz, plan.', icon: Cpu }
              ].map((c) => (
                <div key={c.title} className="p-4 rounded-2xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)]">
                  <c.icon size={18} className="text-[#F5B84B]" />
                  <div className="text-sm font-semibold mt-2">{c.title}</div>
                  <div className="text-xs text-[#9AA4B2] mt-2">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-4">KULLANIM SENARYOLARI</div>
          <div className="grid grid-cols-12 gap-6">
            {useCases.map((u) => {
              const Icon = u.icon;
              return (
                <div key={u.title} className="col-span-12 md:col-span-4 p-6 rounded-3xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)]">
                  <Icon size={18} className="text-[#7AA2FF]" />
                  <div className="text-base font-semibold mt-3">{u.title}</div>
                  <div className="text-sm text-[#9AA4B2] mt-2">{u.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="pricing" className="py-12">
          <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-3">ÜCRETLENDIRME</div>
          <div className="text-2xl font-semibold mb-2">Öğrenme ritmini hızlandıran planı seç.</div>
          <div className="text-sm text-[#9AA4B2] mb-6">En çok tercih edilen plan: <span className="text-[#F5B84B] font-semibold">PRO</span></div>
          <div className="grid grid-cols-12 gap-6">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`col-span-12 md:col-span-4 p-6 rounded-3xl border relative overflow-hidden ${
                  p.name === 'PRO'
                    ? 'border-[#F5B84B] bg-[linear-gradient(135deg,rgba(245,184,75,0.18),rgba(18,24,38,0.9))] shadow-[0_0_40px_rgba(245,184,75,0.15)]'
                    : 'border-[rgba(255,255,255,0.08)] bg-[rgba(18,24,38,0.86)]'
                }`}
              >
                {p.name === 'PRO' && (
                  <div className="absolute top-4 right-4 text-[10px] px-2 py-1 rounded-full bg-[#F5B84B] text-[#1b1b1b] font-semibold">
                    EN POPÜLER
                  </div>
                )}
                <div className="text-xs text-[#9AA4B2]">{p.name}</div>
                <div className="text-3xl font-bold mt-2">{p.price}</div>
                {p.annual && <div className="text-[10px] text-[#6EE7B7] mt-1">Yıllık plan: {p.annual}</div>}
                <div className="text-sm text-[#9AA4B2] mt-2">{p.desc}</div>
                <div className="mt-4 space-y-2 text-sm">
                  {p.items.map((i) => (
                    <div key={i} className="flex items-start gap-2 text-[#9AA4B2]">
                      <CheckCircle size={14} className="text-[#6EE7B7]" /> {i}
                    </div>
                  ))}
                </div>
                <a
                  href="/auth"
                  className={`mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                    p.name === 'PRO'
                      ? 'bg-[#F5B84B] text-[#1b1b1b]'
                      : 'bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)] text-white'
                  }`}
                >
                  {p.name === 'BASIC' ? 'Ücretsiz Başla' : 'Planı Seç'} <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="grid grid-cols-12 gap-6 items-center">
            <div className="col-span-12 lg:col-span-6 p-6 rounded-3xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)]">
              <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-3">HEMEN KAYIT OL</div>
              <div className="text-2xl font-semibold mb-2">Kişisel çalışma odanı oluştur.</div>
              <div className="text-sm text-[#9AA4B2] mb-5">
                Bilgilerini gir, seni giriş ekranına yönlendirelim. Hesabın yoksa kayıt oluşturursun.
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  localStorage.setItem('lead_name', leadName);
                  localStorage.setItem('lead_email', leadEmail);
                  navigate('/auth');
                }}
                className="space-y-3"
              >
                <input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Ad Soyad"
                  className="w-full px-4 py-3 rounded-2xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)] text-sm text-white"
                />
                <input
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="E-posta"
                  className="w-full px-4 py-3 rounded-2xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)] text-sm text-white"
                />
                <button className="w-full px-4 py-3 rounded-2xl bg-[#F5B84B] text-[#1b1b1b] font-semibold">
                  Giriş / Kayıt
                </button>
              </form>
            </div>
            <div className="col-span-12 lg:col-span-6 p-6 rounded-3xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)]">
              <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-3">KISA TUR</div>
              <ol className="space-y-3 text-sm text-[#9AA4B2]">
                <li className="flex items-start gap-3"><CheckCircle size={16} className="text-[#6EE7B7]" /> Kaynaklarını yükle.</li>
                <li className="flex items-start gap-3"><CheckCircle size={16} className="text-[#6EE7B7]" /> Etkileşim araçlarıyla çıktı al.</li>
                <li className="flex items-start gap-3"><CheckCircle size={16} className="text-[#6EE7B7]" /> Profilini kişiselleştir.</li>
              </ol>
            </div>
          </div>
        </section>

        <section id="faq" className="py-10">
          <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-4">S.S.S</div>
          <div className="grid grid-cols-12 gap-6">
            {faqs.map((f) => (
              <div key={f.q} className="col-span-12 md:col-span-6">
                <details className="group rounded-3xl bg-[rgba(10,14,20,0.9)] border border-[rgba(255,255,255,0.08)] p-5">
                  <summary className="cursor-pointer list-none flex items-center justify-between">
                    <span className="text-base font-semibold">{f.q}</span>
                    <span className="text-[#9AA4B2] group-open:rotate-45 transition">+</span>
                  </summary>
                  <div className="text-sm text-[#9AA4B2] mt-3">{f.a}</div>
                </details>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12">
          <div className="p-8 rounded-3xl bg-[rgba(18,24,38,0.86)] border border-[rgba(255,255,255,0.08)] text-center">
            <div className="text-xs tracking-[0.3em] font-bold text-[#9AA4B2] mb-3">HEMEN BASLA</div>
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
              Öğrenmeyi kontrol altına al.
            </h2>
            <p className="text-sm text-[#9AA4B2] mb-6">Kaynaklarını yükle, kendi öğrenme odanı oluştur.</p>
            <a href="/auth" className="px-6 py-3 rounded-2xl bg-[#F5B84B] text-[#1b1b1b] font-semibold inline-flex items-center gap-2">
              Ücretsiz Başla <ArrowRight size={16} />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
