
import React from 'react';
import { Sparkles, Upload, BarChart3, FileText, Globe, ShieldCheck, PlayCircle, ArrowRight } from 'lucide-react';

interface Props {
  onStart: () => void;
  onDemo: () => void;
  onTour: () => void;
}

export const LandingPage: React.FC<Props> = ({ onStart, onDemo, onTour }) => {
  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Navbar */}
      <nav className="px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl">IS</div>
          <span className="text-xl font-black text-slate-900 tracking-tight">InsightStream</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={onTour} className="hidden sm:flex text-sm font-black uppercase text-indigo-600 items-center gap-1.5 hover:text-indigo-700 transition-colors">
            <PlayCircle className="w-4 h-4" /> Turu Başlat
          </button>
          <button onClick={onStart} className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">
            Hemen Başla
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-12 pb-24 text-center lg:text-left flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8" data-tour="hero-landing">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-bold animate-pulse">
            <Sparkles className="w-4 h-4" />
            Yapay Zeka Destekli BI Çözümü
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Verinizi Yükleyin, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Saniyeler İçinde Analiz Edin.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
            Karmaşık Excel ve CSV dosyalarını profesyonel BI dashboard'larına dönüştürün. 10'dan fazla grafik, AI içgörüleri ve What-if simülasyonları ile işinizi yönetin.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button 
              onClick={onStart}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" /> Veri Yükleyerek Başla
            </button>
            <button 
              onClick={onTour}
              className="px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" /> Rehber Turu Başlat
            </button>
          </div>

          <div className="pt-4">
            <button 
              onClick={onDemo}
              className="text-sm font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-2 transition-colors mx-auto lg:mx-0"
            >
              Veya hazır örnek veri setiyle hemen dene <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative">
          <div className="bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 rotate-2 hover:rotate-0 transition-transform duration-500">
             <img src="https://picsum.photos/seed/insight-dashboard/800/600" alt="Dashboard Preview" className="rounded-2xl" />
          </div>
          <div className="absolute -bottom-8 -left-8 bg-indigo-600 text-white p-6 rounded-2xl shadow-xl animate-bounce">
            <BarChart3 className="w-8 h-8" />
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="bg-white py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-black text-center mb-16 uppercase tracking-tight">Kapsamlı BI Araç Kiti</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { icon: <Upload className="w-6 h-6" />, title: "Akıllı Veri Ayrıştırma", desc: "Sütunları, formatları ve hesaplanmış metrikleri otomatik tespit edin." },
              { icon: <Sparkles className="w-6 h-6" />, title: "AI Anlatımları", desc: "Gemini AI tarafından üretilen performans içgörülerini ve trendleri görün." },
              { icon: <BarChart3 className="w-6 h-6" />, title: "10+ Görselleştirme", desc: "Pareto'dan Isı Haritası'na, KPI'larınız için en iyi görünümleri seçin." },
              { icon: <FileText className="w-6 h-6" />, title: "Profesyonel Raporlama", desc: "Tek tıkla PDF raporları oluşturun ve otomatik gönderimler planlayın." },
              { icon: <Globe className="w-6 h-6" />, title: "Veri ile Sohbet", desc: "Analizlerinizi doğal dilde sorular sorarak derinleştirin." },
              { icon: <ShieldCheck className="w-6 h-6" />, title: "Yerel ve Güvenli", desc: "Verileriniz tarayıcınızda kalır. Ham verilerinizi asla sunucularımızda saklamayız." }
            ].map((f, i) => (
              <div key={i} className="flex gap-6 group">
                <div className="w-12 h-12 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center text-indigo-600 transition-all shrink-0 shadow-sm">
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-2 text-slate-900">{f.title}</h4>
                  <p className="text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-slate-400 text-sm font-medium">
        © 2024 InsightStream AI Dashboard Builder. Tüm Hakları Saklıdır.
      </footer>
    </div>
  );
};
