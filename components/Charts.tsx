
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, LineChart, Line, ScatterChart, Scatter, ZAxis, Legend,
  ComposedChart, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { COLORS } from '../constants';
import { Info, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, AreaChart as AreaChartIcon, MoreVertical } from 'lucide-react';

interface ChartProps {
  id?: string; // Persistence için benzersiz ID
  datasetId?: string; // LocalStorage key için
  title: string;
  data: any[];
  type: 'bar' | 'pie' | 'line' | 'scatter' | 'area' | 'composed';
  dataKey?: string;
  secondaryDataKey?: string;
  categoryKey?: string;
  height?: number;
  highlightKey?: string;
  layout?: 'horizontal' | 'vertical';
  minimal?: boolean;
  onExplain?: (title: string, type: string) => void;
}

export const BIChart: React.FC<ChartProps> = ({ 
  id, datasetId, title, data, type: initialType, dataKey = 'value', secondaryDataKey, categoryKey = 'label', height = 300, highlightKey, layout = 'horizontal', minimal = false, onExplain
}) => {
  const [currentType, setCurrentType] = useState(initialType);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  // Persistence: Kullanıcı tercihini yükle
  useEffect(() => {
    if (id && datasetId) {
      const overrides = JSON.parse(localStorage.getItem(`chartTypeOverrides:${datasetId}`) || '{}');
      if (overrides[id]) {
        setCurrentType(overrides[id]);
      }
    }
  }, [id, datasetId]);

  // Persistence: Kullanıcı tercihini kaydet
  const handleTypeChange = (newType: any) => {
    setCurrentType(newType);
    setShowTypeMenu(false);
    if (id && datasetId) {
      const overrides = JSON.parse(localStorage.getItem(`chartTypeOverrides:${datasetId}`) || '{}');
      overrides[id] = newType;
      localStorage.setItem(`chartTypeOverrides:${datasetId}`, JSON.stringify(overrides));
    }
  };

  // Uyumluluk Kontrolleri
  const isTimeBased = useMemo(() => {
    if (!data || data.length === 0) return false;
    const firstLabel = String(data[0][categoryKey]).toLowerCase();
    const timeKeywords = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', '202', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
    return timeKeywords.some(k => firstLabel.includes(k));
  }, [data, categoryKey]);

  const isNumericRelation = initialType === 'scatter';

  if (!data || data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center ${minimal ? '' : 'border rounded-[2rem] bg-white p-8'} text-slate-300 font-bold uppercase text-[10px] tracking-widest text-center`} style={{ height }}>
        <div className="mb-2 opacity-20">📊</div>
        BU GÖRSELLEŞTİRME İÇİN VERİ YETERSİZ
      </div>
    );
  }

  // Pie Chart için Veri Hazırlama (Top 7 + Diğer)
  const pieData = useMemo(() => {
    if (currentType !== 'pie') return data;
    const sorted = [...data].sort((a, b) => b[dataKey] - a[dataKey]);
    if (sorted.length <= 8) return sorted;
    const top7 = sorted.slice(0, 7);
    const others = sorted.slice(7).reduce((acc, curr) => acc + (curr[dataKey] || 0), 0);
    return [...top7, { [categoryKey]: 'DİĞER', [dataKey]: others }];
  }, [data, currentType, dataKey, categoryKey]);

  const renderChart = () => {
    const chartData = currentType === 'pie' ? pieData : data;
    
    switch (currentType) {
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={minimal ? 40 : 60}
              outerRadius={minimal ? 60 : 80}
              paddingAngle={5}
              dataKey={dataKey}
              nameKey={categoryKey}
              label={minimal ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      case 'bar':
        return (
          <ComposedChart data={chartData} layout={layout}>
            <CartesianGrid strokeDasharray="3 3" vertical={layout === 'horizontal'} stroke="#f1f5f9" />
            {layout === 'horizontal' ? (
              <>
                <XAxis dataKey={categoryKey} fontSize={9} tickLine={false} axisLine={false} fontWeight="bold" />
                <YAxis yAxisId="left" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
              </>
            ) : (
              <>
                <XAxis type="number" fontSize={9} hide />
                <YAxis dataKey={categoryKey} type="category" fontSize={9} width={80} tickLine={false} axisLine={false} fontWeight="bold" />
              </>
            )}
            {secondaryDataKey && <YAxis yAxisId="right" orientation="right" domain={[0, 100]} fontSize={9} tickFormatter={(val) => `%${val}`} />}
            <Tooltip 
              formatter={(value: any, name: string, props: any) => {
                if (props.payload.pay) return [`${value} (Pay: %${props.payload.pay.toFixed(1)})`, 'İşlem Sayısı'];
                return [value, title];
              }}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '11px' }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar yAxisId="left" dataKey={dataKey} radius={layout === 'horizontal' ? [6, 6, 0, 0] : [0, 6, 6, 0]} barSize={layout === 'horizontal' ? 30 : 20}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={highlightKey && entry[highlightKey] !== null ? '#6366f1' : COLORS[index % COLORS.length]} 
                  fillOpacity={highlightKey && entry[highlightKey] !== null ? 1 : 0.8}
                />
              ))}
            </Bar>
            {secondaryDataKey && (
              <Line yAxisId="right" type="monotone" dataKey={secondaryDataKey} stroke="#f43f5e" strokeWidth={3} dot={{ r: 3 }} />
            )}
          </ComposedChart>
        );
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={categoryKey} fontSize={9} fontWeight="bold" />
            <YAxis fontSize={9} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
            {'actual' in (chartData[0] || {}) || 'forecast' in (chartData[0] || {}) ? (
              <>
                <Line type="monotone" dataKey="actual" name="Gerçekleşen" stroke="#6366f1" strokeWidth={3} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="forecast" name="Tahmin" stroke="#94a3b8" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 3 }} connectNulls />
              </>
            ) : (
              <Line type="monotone" dataKey={dataKey} stroke="#6366f1" strokeWidth={3} dot={{ r: 3 }} />
            )}
            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={categoryKey} fontSize={9} fontWeight="bold" />
            <YAxis fontSize={9} />
            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
            <Area type="monotone" dataKey={dataKey} stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={3} />
          </AreaChart>
        );
      case 'scatter':
        return (
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" dataKey="x" name="Ort. Fiyat" unit="₺" fontSize={9} tickFormatter={(v) => `₺${v}`} />
            <YAxis type="number" dataKey="y" name="Top. Miktar" fontSize={9} />
            <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Toplam Kâr" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100 text-[10px] space-y-1">
                      <p className="font-black text-indigo-600 uppercase mb-1">{d.label}</p>
                      <p><span className="text-slate-400">Kategori:</span> {d.category}</p>
                      <p><span className="text-slate-400">Ağr. Ort. Fiyat:</span> ₺{d.x.toLocaleString()}</p>
                      <p><span className="text-slate-400">Toplam Miktar:</span> {d.y.toLocaleString()}</p>
                      <p className="font-bold text-emerald-600"><span className="text-slate-400">Toplam Kâr:</span> ₺{d.z.toLocaleString()}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Products" data={chartData}>
               {chartData.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.6} />
               ))}
            </Scatter>
          </ScatterChart>
        );
      default:
        return null;
    }
  };

  const TypeSwitcher = () => (
    <div className="relative z-[50]">
      <button 
        onClick={() => setShowTypeMenu(!showTypeMenu)}
        className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"
        title="Grafik Tipini Değiştir"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      
      {showTypeMenu && (
        <div className="absolute right-0 top-6 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 min-w-[140px] animate-in zoom-in duration-200">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest px-3 py-1 mb-1">Görünüm Seç</p>
          <div className="space-y-1">
            <button 
              disabled={isNumericRelation}
              onClick={() => handleTypeChange('bar')} 
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold transition-colors ${currentType === 'bar' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 disabled:opacity-30'}`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Bar Grafiği
            </button>
            <button 
              disabled={isNumericRelation || (!isTimeBased && currentType !== 'line')}
              onClick={() => handleTypeChange('line')} 
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold transition-colors ${currentType === 'line' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 disabled:opacity-30'}`}
            >
              <LineChartIcon className="w-3.5 h-3.5" /> Çizgi Grafiği
            </button>
            <button 
              disabled={isNumericRelation || isTimeBased}
              onClick={() => handleTypeChange('pie')} 
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold transition-colors ${currentType === 'pie' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 disabled:opacity-30'}`}
            >
              <PieChartIcon className="w-3.5 h-3.5" /> Pasta Grafiği
            </button>
            <button 
              disabled={isNumericRelation || !isTimeBased}
              onClick={() => handleTypeChange('area')} 
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold transition-colors ${currentType === 'area' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 disabled:opacity-30'}`}
            >
              <AreaChartIcon className="w-3.5 h-3.5" /> Alan Grafiği
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (minimal) {
    return (
      <div className="flex flex-col h-full w-full relative">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
          <div className="flex gap-1 no-print">
            {onExplain && (
              <button 
                onClick={() => onExplain(title, currentType)}
                className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"
                title="Bu grafik ne anlatıyor?"
              >
                <Info className="w-3 h-3" />
              </button>
            )}
            <TypeSwitcher />
          </div>
        </div>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full chart-container group hover:shadow-lg transition-all duration-300 relative">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-colors">{title}</h3>
        <div className="flex gap-2 items-center no-print">
          {onExplain && (
            <button 
              onClick={() => onExplain(title, currentType)}
              className="text-[9px] font-black uppercase text-slate-300 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <Info className="w-3.5 h-3.5" /> Anlat
            </button>
          )}
          <TypeSwitcher />
          <div className="flex gap-1 opacity-20 items-center ml-1">
            <div className="w-1 h-1 rounded-full bg-slate-900"></div>
            <div className="w-1 h-1 rounded-full bg-slate-900"></div>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
