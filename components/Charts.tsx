
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, LineChart, Line, ScatterChart, Scatter, ZAxis, Legend,
  ComposedChart, PieChart, Pie
} from 'recharts';
import { COLORS } from '../constants';
import { Info } from 'lucide-react';

interface ChartProps {
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
  title, data, type, dataKey = 'value', secondaryDataKey, categoryKey = 'label', height = 300, highlightKey, layout = 'horizontal', minimal = false, onExplain
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center ${minimal ? '' : 'border rounded-[2rem] bg-white p-8'} text-slate-300 font-bold uppercase text-[10px] tracking-widest text-center`} style={{ height }}>
        <div className="mb-2 opacity-20">📊</div>
        BU GÖRSELLEŞTİRME İÇİN VERİ YETERSİZ
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey={dataKey}
              nameKey={categoryKey}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      case 'bar':
        return (
          <ComposedChart data={data} layout={layout}>
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
              {data.map((entry, index) => (
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
        const isForecastChart = data.length > 0 && ('actual' in data[0] || 'forecast' in data[0]);
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={categoryKey} fontSize={9} fontWeight="bold" />
            <YAxis fontSize={9} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
            {isForecastChart ? (
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
            <Scatter name="Products" data={data}>
               {data.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.6} />
               ))}
            </Scatter>
          </ScatterChart>
        );
      default:
        return null;
    }
  };

  if (minimal) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
          {onExplain && (
            <button 
              onClick={() => onExplain(title, type)}
              className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"
              title="Bu grafik ne anlatıyor?"
            >
              <Info className="w-3 h-3" />
            </button>
          )}
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
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full chart-container group hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-colors">{title}</h3>
        <div className="flex gap-2">
          {onExplain && (
            <button 
              onClick={() => onExplain(title, type)}
              className="text-[9px] font-black uppercase text-slate-300 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <Info className="w-3.5 h-3.5" /> Anlat
            </button>
          )}
          <div className="flex gap-1 opacity-20 items-center">
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
