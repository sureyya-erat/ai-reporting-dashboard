
import React, { useState, useMemo, useEffect } from 'react';
import { BIChart } from './Charts';
import { CalculationModule } from '../services/calculationModule';
import { HistoryService } from '../services/historyService';
import { Dataset, DataRow, FilterState, SchemaMapping, DashboardTemplate, PinnedChart, CalculatedField } from '../types';
import { MONTH_ORDER, WEEKDAY_ORDER } from '../constants';
import { getAIInsights, getChartExplanation } from '../services/gemini';
import { CalculatedFieldModal } from './CalculatedFieldModal';
import { ChartBuilderModal } from './ChartBuilderModal';
import { 
  Printer, Mail, Sparkles, Filter, Settings2,
  X, AlertCircle, RotateCcw, LayoutDashboard, Info, Save, 
  Lock, Unlock, Bookmark, Trash, Download, PinOff, Loader2, Camera, Calculator, PlayCircle, Plus
} from 'lucide-react';

interface Props {
  dataset: Dataset;
  onBack: () => void;
  onStartTour: () => void;
}

export const Dashboard: React.FC<Props> = ({ dataset, onBack, onStartTour }) => {
  const [activeMapping, setActiveMapping] = useState<SchemaMapping>(dataset.mapping);
  const [showMapper, setShowMapper] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [pinnedCharts, setPinnedCharts] = useState<PinnedChart[]>([]);
  const [calculatedFields, setCalculatedFields] = useState<CalculatedField[]>([]);
  const [explanation, setExplanation] = useState<{ title: string, text: string } | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  
  const [filterState, setFilterState] = useState<FilterState>({
    years: "ALL", months: "ALL", cities: "ALL", branches: "ALL", categories: "ALL",
    genericFilters: {}
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);

  useEffect(() => {
    const savedTmpl = localStorage.getItem('insightstream_templates');
    if (savedTmpl) setTemplates(JSON.parse(savedTmpl));

    const storageKey = `insightstream_pinned_${dataset.name}`;
    const savedPinned = localStorage.getItem(storageKey);
    if (savedPinned) setPinnedCharts(JSON.parse(savedPinned));

    const calcKey = `insightstream_calc_fields_${dataset.name}`;
    const savedCalc = localStorage.getItem(calcKey);
    if (savedCalc) setCalculatedFields(JSON.parse(savedCalc));
  }, [dataset.name]);

  const handleSaveCalcField = (field: CalculatedField) => {
    const updated = [...calculatedFields, field];
    setCalculatedFields(updated);
    localStorage.setItem(`insightstream_calc_fields_${dataset.name}`, JSON.stringify(updated));
    setShowCalcModal(false);
  };

  const handleSaveCustomChart = (chart: PinnedChart) => {
    const updated = [...pinnedCharts, chart];
    setPinnedCharts(updated);
    const storageKey = `insightstream_pinned_${dataset.name}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setShowBuilderModal(false);
    
    // Yeni eklenen grafiğe odaklanmak için sona kaydır
    setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const removeCalcField = (id: string) => {
    const updated = calculatedFields.filter(f => f.id !== id);
    setCalculatedFields(updated);
    localStorage.setItem(`insightstream_calc_fields_${dataset.name}`, JSON.stringify(updated));
  };

  const handleExplainChart = async (title: string, type: string) => {
    setExplainLoading(true);
    try {
      const text = await getChartExplanation(title, type);
      setExplanation({ title, text });
    } catch (err) {
      setExplanation({ title, text: "Açıklama üretilirken bir hata oluştu." });
    } finally {
      setExplainLoading(false);
    }
  };

  const processedRows = useMemo(() => dataset.rows.map(r => CalculationModule.processRow(r, activeMapping, calculatedFields)), [dataset, activeMapping, calculatedFields]);
  const filteredRows = useMemo(() => CalculationModule.applyFilters(processedRows, filterState, activeMapping), [processedRows, filterState, activeMapping]);
  const kpis = useMemo(() => CalculationModule.getTotalKPIs(filteredRows), [filteredRows]);

  const saveSnapshot = () => {
    HistoryService.saveRecord(dataset.name, {
      type: 'dashboard_snapshot',
      datasetId: dataset.name,
      titleTR: `${dataset.name} - Anlık Görünüm`,
      filterStateSnapshot: filterState,
      payload: { kpis }
    });
    alert("Görünüm kaydı geçmişe eklendi.");
  };

  const removePinned = (id: string) => {
    const updated = pinnedCharts.filter(p => p.id !== id);
    setPinnedCharts(updated);
    const storageKey = `insightstream_pinned_${dataset.name}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const clearAllPinned = () => {
    if (!confirm("Tüm pinlenmiş grafikleri kaldırmak istediğinize emin misiniz?")) return;
    setPinnedCharts([]);
    const storageKey = `insightstream_pinned_${dataset.name}`;
    localStorage.removeItem(storageKey);
  };

  const saveTemplate = () => {
    const name = prompt("Şablon adı giriniz:", `Şablon ${templates.length + 1}`);
    if (!name) return;
    const newT: DashboardTemplate = {
      id: `tmpl_${Date.now()}`,
      name,
      mapping: activeMapping,
      mode: dataset.mode,
      filters: filterState,
      isLocked: true,
      createdAt: Date.now(),
      calculatedFields
    };
    const updated = [...templates, newT];
    setTemplates(updated);
    localStorage.setItem('insightstream_templates', JSON.stringify(updated));
  };

  const loadTemplate = (t: DashboardTemplate) => {
    setActiveMapping(t.mapping);
    setFilterState(t.filters);
    setIsLocked(t.isLocked);
    if (t.calculatedFields) setCalculatedFields(t.calculatedFields);
    setShowMapper(false);
  };

  const deleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('insightstream_templates', JSON.stringify(updated));
  };

  const options = useMemo(() => ({
    years: Array.from(new Set(processedRows.map(r => r['YEAR_final'] as number).filter(v => v))).sort((a: number, b: number) => b - a),
    months: MONTH_ORDER.map((name, i) => ({ id: i + 1, name })),
    cities: Array.from(new Set(processedRows.map(r => r['CITY_final'] as string))).sort(),
    categories: Array.from(new Set(processedRows.map(r => r['CATEGORY_final'] as string))).sort(),
    branches: Array.from(new Set(processedRows.filter(r => filterState.cities === "ALL" || (filterState.cities as string[]).includes(r['CITY_final'])).map(r => r['BRANCH_final'] as string))).sort()
  }), [processedRows, filterState.cities]);

  const chartData = useMemo(() => {
    const agg = (rows: DataRow[], dim: string, met: string, type: 'sum' | 'count' = 'sum', sortIdx?: string) => {
      const g: Record<string, any> = {};
      rows.forEach(r => {
        const k = r[dim];
        if (!g[k]) g[k] = { label: k, value: type === 'sum' ? 0 : new Set(), sort: sortIdx ? r[sortIdx] : 0 };
        if (type === 'sum') g[k].value += r[met]; else g[k].value.add(r['TX_ID_final']);
      });
      return Object.values(g).map((x: any) => ({ label: x.label, value: type === 'sum' ? x.value : x.value.size, sort: x.sort })).sort((a, b) => sortIdx ? a.sort - b.sort : b.value - a.value);
    };

    return {
      monthlyProfit: agg(filteredRows, 'MONTH_final', 'PROFIT_final', 'sum', 'MONTH_index'),
      weekdayProfit: agg(filteredRows, 'WEEKDAY_final', 'PROFIT_final', 'sum', 'WEEKDAY_index'),
      branchRev: agg(filteredRows, 'BRANCH_final', 'REVENUE_final').slice(0, 10),
      categoryTx: CalculationModule.getTransactionsByCategory(filteredRows),
      priceQtyBubble: CalculationModule.getPriceQtyBubbleData(filteredRows),
      forecast: CalculationModule.getForecastData(filteredRows),
      pareto: CalculationModule.getParetoData(filteredRows)
    };
  }, [filteredRows]);

  const toggleFilter = (key: keyof FilterState, val: any) => {
    setFilterState(prev => {
      const cur = prev[key];
      if (cur === "ALL") return { ...prev, [key]: [val] };
      const next = cur.includes(val) ? cur.filter((v: any) => v !== val) : [...cur, val];
      return { ...prev, [key]: next.length === 0 ? "ALL" : next };
    });
  };

  const runAI = async () => {
    setAiLoading(true);
    try { 
      const res = await getAIInsights(dataset, filterState);
      setInsights(res); 
      HistoryService.saveRecord(dataset.name, {
        type: 'insight',
        datasetId: dataset.name,
        titleTR: `AI Analiz: ${dataset.name}`,
        filterStateSnapshot: filterState,
        payload: { text: res }
      });
    } finally { setAiLoading(false); }
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    window.print();
  };

  const MultiSelectSlicer = ({ title, options, selected, onToggle, onClear }: any) => (
    <div className="pb-6 border-b border-slate-100 last:border-0 space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</label>
        <button onClick={onClear} className="text-[10px] text-indigo-500 font-bold hover:underline">Temizle</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={onClear} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${selected === "ALL" ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}>Tümü</button>
        {options.map((opt: any) => {
          const id = opt.id !== undefined ? opt.id : opt;
          const label = opt.name || opt;
          const active = selected !== "ALL" && selected.includes(id);
          return <button key={id} onClick={() => onToggle(id)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}>{label}</button>;
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <aside data-tour="filters" className="w-full lg:w-72 bg-white border-r border-slate-200 p-6 no-print overflow-y-auto lg:h-screen lg:sticky lg:top-0 shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2"><Filter className="w-5 h-5 text-indigo-600" /><h2 className="font-black text-lg uppercase">Filtreler</h2></div>
          <button onClick={() => setFilterState({ years: "ALL", months: "ALL", cities: "ALL", branches: "ALL", categories: "ALL", genericFilters: {} })} className="p-2 text-slate-400 hover:text-indigo-600"><RotateCcw className="w-4 h-4" /></button>
        </div>
        
        {calculatedFields.length > 0 && (
          <div className="mb-8 p-4 bg-indigo-50 rounded-2xl space-y-3 border border-indigo-100">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Calculator className="w-3 h-3" /> Hesaplı Alanlar</p>
            <div className="space-y-1">
              {calculatedFields.map(f => (
                <div key={f.id} className="flex items-center justify-between group">
                  <span className="text-[11px] font-bold text-slate-600 truncate flex-1">{f.name}</span>
                  <button onClick={() => removeCalcField(f.id)} className="p-1 opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600"><Trash className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {templates.length > 0 && (
          <div className="mb-8 p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Bookmark className="w-3 h-3" /> Kayıtlı Şablonlar</p>
            <div className="space-y-1">
              {templates.map(t => (
                <div key={t.id} className="flex items-center justify-between group">
                  <button onClick={() => loadTemplate(t)} className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 truncate flex-1 text-left">{t.name}</button>
                  <button onClick={() => deleteTemplate(t.id)} className="p-1 opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600"><Trash className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <MultiSelectSlicer title="Yıl" options={options.years} selected={filterState.years} onToggle={(v:any)=>toggleFilter('years', v)} onClear={()=>setFilterState(p=>({...p, years:"ALL"}))} />
          <MultiSelectSlicer title="Ay" options={options.months} selected={filterState.months} onToggle={(v:any)=>toggleFilter('months', v)} onClear={()=>setFilterState(p=>({...p, months:"ALL"}))} />
          <MultiSelectSlicer title="Şehir" options={options.cities} selected={filterState.cities} onToggle={(v:any)=>toggleFilter('cities', v)} onClear={()=>setFilterState(p=>({...p, cities:"ALL"}))} />
          <MultiSelectSlicer title="Şube" options={options.branches} selected={filterState.branches} onToggle={(v:any)=>toggleFilter('branches', v)} onClear={()=>setFilterState(p=>({...p, branches:"ALL"}))} />
          <MultiSelectSlicer title="Kategori" options={options.categories} selected={filterState.categories} onToggle={(v:any)=>toggleFilter('categories', v)} onClear={()=>setFilterState(p=>({...p, categories:"ALL"}))} />
        </div>
        <button onClick={runAI} disabled={aiLoading} className="w-full mt-8 bg-indigo-600 text-white p-4 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 group shadow-xl shadow-indigo-100 disabled:opacity-50">
          <Sparkles className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} /> AI Analiz Et
        </button>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{dataset.name}</h1>
              <div className="flex items-center gap-3">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${dataset.mode === 'URBAN_SALES' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {dataset.mode === 'URBAN_SALES' ? 'URBAN SALES MODE' : 'GENERIC BI MODE'}
                </span>
                <button onClick={()=>setShowMapper(!showMapper)} className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline"><Settings2 className="w-3 h-3" /> Sütunlar</button>
                <button onClick={()=>setShowCalcModal(true)} className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline"><Calculator className="w-3 h-3" /> Hesaplı Alan</button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowBuilderModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100"><Plus className="w-4 h-4" /> Grafik Ekle</button>
            <button onClick={onStartTour} title="Tur Başlat" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100"><PlayCircle className="w-4 h-4" /> Rehber Tur</button>
            <button onClick={saveSnapshot} title="Görünümü Kaydet" className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 transition-all flex items-center gap-2"><Camera className="w-4 h-4" /> Snapshot</button>
            <button onClick={saveTemplate} title="Şablonu Kaydet" className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50"><Bookmark className="w-4 h-4" /></button>
            <button type="button" onClick={handlePrint} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-slate-50 active:scale-95"><Printer className="w-4 h-4" /> Yazdır</button>
          </div>
        </header>

        <main id="dashboard-content" className="p-8 space-y-12">
          {showMapper && (
            <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-300 relative no-print">
               <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-4">
                   <h3 className="font-black uppercase tracking-widest">Sütun Eşleştirme Sihirbazı</h3>
                   <button 
                     onClick={() => setIsLocked(!isLocked)} 
                     className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${isLocked ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}
                   >
                     {isLocked ? <><Lock className="w-3 h-3" /> Kilitli</> : <><Unlock className="w-3 h-3" /> Düzenlenebilir</>}
                   </button>
                 </div>
                 <button onClick={()=>setShowMapper(false)}><X className="w-6 h-6" /></button>
               </div>
               <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-opacity ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                 {Object.entries(activeMapping).map(([key, val]) => (
                   <div key={key} className="space-y-1">
                     <label className="text-[10px] font-black text-indigo-300 uppercase">{key}</label>
                     <select 
                       className="w-full bg-indigo-800 border-none text-xs rounded-lg p-2 outline-none"
                       value={val || ''}
                       onChange={e => setActiveMapping(prev => ({...prev, [key]: e.target.value || null}))}
                     >
                       <option value="">Eşleşme Yok</option>
                       {dataset.columns.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                   </div>
                 ))}
               </div>
               <div className="flex gap-4 mt-8">
                 <button onClick={()=>setShowMapper(false)} className="bg-white text-indigo-900 px-8 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2"><Save className="w-4 h-4" /> Eşleştirmeyi Onayla</button>
                 <button onClick={() => { setActiveMapping(dataset.mapping); setIsLocked(false); }} className="bg-indigo-800 text-indigo-200 px-6 py-3 rounded-xl font-black uppercase text-xs">Varsayılana Dön</button>
               </div>
            </div>
          )}

          <div data-tour="kpis" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              { label: 'Ciro (Revenue)', value: `₺${kpis.revenue.toLocaleString()}`, color: 'text-indigo-600', icon: '💰', bg: 'bg-indigo-50' },
              { label: 'Kâr (Profit)', value: `₺${kpis.profit.toLocaleString()}`, color: 'text-emerald-600', icon: '📈', bg: 'bg-emerald-50' },
              { label: 'Satılan Birim', value: kpis.units.toLocaleString(), color: 'text-orange-600', icon: '📦', bg: 'bg-orange-50' },
              { label: 'İşlem Sayısı', value: kpis.txns.toLocaleString(), color: 'text-slate-600', icon: '🧾', bg: 'bg-slate-50' }
            ].map(k => (
              <div key={k.label} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center group transition-all hover:shadow-lg">
                <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">{k.label}</p><h4 className={`text-3xl font-black ${k.color}`}>{k.value}</h4></div>
                <div className={`${k.bg} w-14 h-14 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform no-print`}>{k.icon}</div>
              </div>
            ))}
          </div>

          {insights && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-xl space-y-4 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-3 text-indigo-600"><Sparkles className="w-6 h-6" /><h3 className="font-black uppercase tracking-widest text-sm">AI Performans Özeti</h3></div>
               <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{insights}</div>
            </div>
          )}

          <div data-tour="charts" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12">
              <BIChart id="monthly-profit" datasetId={dataset.name} onExplain={handleExplainChart} title="AYLIK KÂR + 6 AY TAHMİNLEME" type="line" data={chartData.forecast} height={400} />
            </div>
            
            <div className="lg:col-span-6">
              <div className="h-full flex flex-col">
                <BIChart id="category-tx" datasetId={dataset.name} onExplain={handleExplainChart} title="KATEGORİYE GÖRE İŞLEM SAYISI" type="bar" data={chartData.categoryTx} layout="vertical" height={400} />
                <div className="mt-2 px-6 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between no-print">
                   <p className="text-[9px] font-bold text-slate-400 uppercase">Toplam İşlem: {kpis.txns} | DISTINCT Sayım Aktif</p>
                   <Info className="w-3 h-3 text-slate-300" />
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-6">
              {chartData.priceQtyBubble.isFallback ? (
                <BIChart id="price-bubble" datasetId={dataset.name} onExplain={handleExplainChart} title="KATEGORİ BAZLI CİRO (ALTERNATİF)" type="bar" data={chartData.priceQtyBubble.fallbackData} height={400} />
              ) : (
                <BIChart id="price-bubble" datasetId={dataset.name} onExplain={handleExplainChart} title="FİYAT x MİKTAR İLİŞKİSİ (BALON = TOPLAM KÂR)" type="scatter" data={chartData.priceQtyBubble.data} height={400} />
              )}
            </div>

            <div className="lg:col-span-8">
              <BIChart id="branch-rev" datasetId={dataset.name} onExplain={handleExplainChart} title="ŞUBE BAZLI CİRO (İLK 10)" type="bar" data={chartData.branchRev} height={400} />
            </div>
            <div className="lg:col-span-4">
              <BIChart id="pareto-cat" datasetId={dataset.name} onExplain={handleExplainChart} title="PARETO: KATEGORİ CİRO DAĞILIMI" type="bar" data={chartData.pareto} secondaryDataKey="cumulativePercent" height={400} />
            </div>
            
            <div className="lg:col-span-12">
              <BIChart id="weekday-profit" datasetId={dataset.name} onExplain={handleExplainChart} title="HAFTALIK KÂR PERFORMANSI" type="bar" data={chartData.weekdayProfit} height={300} />
            </div>
          </div>

          {pinnedCharts.length > 0 && (
            <section className="space-y-8 animate-in fade-in duration-700">
               <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Kişiselleştirilmiş / Pinlenmiş Grafikler</h2>
                  </div>
                  <button onClick={clearAllPinned} className="text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2 no-print">
                    <PinOff className="w-3 h-3" /> Tümünü Kaldır
                  </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {pinnedCharts.map(pc => (
                    <div key={pc.id} className="relative group">
                      <BIChart id={pc.id} datasetId={dataset.name} onExplain={handleExplainChart} title={pc.title} type={pc.type} data={pc.data} height={250} />
                      <button 
                        onClick={() => removePinned(pc.id)}
                        className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur shadow-sm rounded-lg text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all no-print"
                        title="Grafiği Kaldır"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
               </div>
            </section>
          )}
        </main>
      </div>

      {showCalcModal && (
        <CalculatedFieldModal 
          dataset={dataset} 
          onSave={handleSaveCalcField} 
          onClose={() => setShowCalcModal(false)} 
        />
      )}

      {showBuilderModal && (
        <ChartBuilderModal 
          dataset={dataset} 
          calculatedFields={calculatedFields}
          onSave={handleSaveCustomChart} 
          onClose={() => setShowBuilderModal(false)} 
        />
      )}

      {/* EXPLAIN MODAL */}
      {explanation && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6" />
                <h3 className="font-black uppercase tracking-widest text-sm">Grafik Analizi</h3>
              </div>
              <button onClick={() => setExplanation(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{explanation.title}</h4>
              <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-line text-sm leading-relaxed">
                {explanation.text}
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex justify-end">
              <button onClick={() => setExplanation(null)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100">Anladım</button>
            </div>
          </div>
        </div>
      )}

      {/* LOADER OVERLAY */}
      {explainLoading && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-white/40 backdrop-blur-sm no-print">
          <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Analiz Yapılıyor...</p>
          </div>
        </div>
      )}
    </div>
  );
};
