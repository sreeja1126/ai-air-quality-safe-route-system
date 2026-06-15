import MapRouter from './components/MapRouter';
import MLSimulator from './components/MLSimulator';
import { getRealtimeAQI } from './services/api';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Wind, Baby, Users, HeartPulse, PersonStanding, Sun, Moon } from 'lucide-react';

// --- ADVANCED HEALTH LOGIC ---
const getAqiStyles = (aqi) => {
  if (aqi <= 50) return { color: 'text-emerald-500', glow: 'shadow-emerald-500/50', gradient: 'from-emerald-400 to-emerald-600', label: 'Good' };
  if (aqi <= 100) return { color: 'text-yellow-500', glow: 'shadow-yellow-500/50', gradient: 'from-yellow-400 to-amber-500', label: 'Moderate' };
  if (aqi <= 150) return { color: 'text-orange-500', glow: 'shadow-orange-500/50', gradient: 'from-orange-400 to-orange-600', label: 'Sensitive' };
  if (aqi <= 200) return { color: 'text-rose-500', glow: 'shadow-rose-500/50', gradient: 'from-rose-400 to-rose-600', label: 'Unhealthy' };
  if (aqi <= 300) return { color: 'text-purple-500', glow: 'shadow-purple-500/50', gradient: 'from-purple-400 to-purple-600', label: 'Very Unhealthy' };
  return { color: 'text-rose-900', glow: 'shadow-rose-900/50', gradient: 'from-rose-700 to-rose-900', label: 'Hazardous' };
};

const getDemographicRisks = (aqi) => {
  if (aqi <= 50) return { child: 'Safe', elderly: 'Safe', sensitive: 'Safe', adult: 'Safe' };
  if (aqi <= 100) return { child: 'Safe', elderly: 'Moderate', sensitive: 'Moderate', adult: 'Safe' };
  if (aqi <= 150) return { child: 'Moderate', elderly: 'At Risk', sensitive: 'At Risk', adult: 'Moderate' };
  if (aqi <= 200) return { child: 'At Risk', elderly: 'Danger', sensitive: 'Danger', adult: 'At Risk' };
  if (aqi <= 300) return { child: 'Danger', elderly: 'Danger', sensitive: 'Danger', adult: 'Danger' };
  return { child: 'Hazardous', elderly: 'Hazardous', sensitive: 'Hazardous', adult: 'Hazardous' };
};

const getRiskColor = (risk) => {
  switch (risk) {
    case 'Safe': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
    case 'Moderate': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50';
    case 'At Risk': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
    case 'Danger': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
    case 'Hazardous': return 'bg-rose-900 dark:bg-rose-950 text-white border-rose-900 dark:border-rose-900';
    default: return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700';
  }
};

const DemographicCard = ({ icon: Icon, title, risk }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-white/60 dark:border-slate-600/50 transition-colors">
    <Icon className={`w-8 h-8 mb-2 ${getRiskColor(risk).split(' ')[2]}`} />
    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{title}</span>
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(risk)}`}>
      {risk}
    </span>
  </div>
);

export default function App() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSearch = async (searchCity) => {
    if (!searchCity) return;
    setLoading(true);
    try {
      const result = await getRealtimeAQI(searchCity);
      setData({
        aqi: result.aqi,
        styles: getAqiStyles(result.aqi),
        demographics: getDemographicRisks(result.aqi),
        weather: result.weather,
        pollutants: [
          { name: 'PM2.5', value: result.aqi * 0.5 },
          { name: 'PM10', value: result.aqi * 0.6 },
          { name: 'NO2', value: result.aqi * 0.2 },
          { name: 'SO2', value: result.aqi * 0.1 },
          { name: 'O3', value: result.aqi * 0.15 },
        ]
      });
    } catch (error) {
      alert("Make sure your Python backend is running and using the correct API key!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500 relative overflow-hidden font-sans selection:bg-cyan-200 pb-12">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-300 dark:bg-cyan-900/40 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-pulse duration-[10000ms]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-300 dark:bg-emerald-900/30 rounded-full mix-blend-multiply filter blur-[120px] opacity-30"></div>
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-teal-200 dark:bg-teal-900/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>

      <div className="relative max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        <header className="flex items-center justify-between bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/60 dark:border-slate-700/60 p-4 rounded-3xl shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-cyan-500 to-emerald-500 p-2 rounded-xl shadow-lg shadow-cyan-200/50 dark:shadow-none">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              EcoPath<span className="text-emerald-500 font-light">AI</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-full border border-white/80 dark:border-slate-600 p-1 shadow-sm w-full max-w-md transition-colors">
              <input
                type="text"
                placeholder="Search target city..."
                className="flex-1 bg-transparent px-4 py-2 outline-none text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.target.value)}
              />
              <button
                onClick={() => handleSearch(document.querySelector('input').value)}
                disabled={loading}
                className="bg-slate-900 dark:bg-cyan-600 text-white px-5 py-2 rounded-full hover:bg-emerald-500 dark:hover:bg-cyan-500 transition-all font-semibold"
              >
                {loading ? '...' : 'Scan'}
              </button>
            </div>

            <div className="flex items-center gap-4 border-l border-slate-300 dark:border-slate-600 pl-6 transition-colors">
              
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-cyan-400 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

            </div>
          </div>
        </header>

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="col-span-1 md:col-span-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/80 dark:border-slate-700/80 rounded-[2rem] p-8 shadow-sm flex flex-col items-center justify-center text-center transition-colors">
              <div className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">Real-Time AQI</div>
              <div className={`relative flex items-center justify-center w-48 h-48 rounded-full bg-white dark:bg-slate-800 shadow-xl mb-6 ${data.styles.glow}`}>
                <div className={`absolute inset-0 rounded-full opacity-20 bg-gradient-to-tr ${data.styles.gradient}`}></div>
                <div className="z-10 text-7xl font-black tracking-tighter text-slate-800 dark:text-white">{data.aqi}</div>
              </div>
              <div className={`px-6 py-2 rounded-full text-lg font-bold text-white bg-gradient-to-r ${data.styles.gradient} shadow-lg dark:shadow-none`}>
                {data.styles.label}
              </div>
            </div>

            <div className="col-span-1 md:col-span-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/80 dark:border-slate-700/80 rounded-[2rem] p-8 shadow-sm transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Personalized Health Risk Matrix</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <DemographicCard icon={Baby} title="Children" risk={data.demographics.child} />
                <DemographicCard icon={HeartPulse} title="Sensitive" risk={data.demographics.sensitive} />
                <DemographicCard icon={Users} title="Elderly" risk={data.demographics.elderly} />
                <DemographicCard icon={PersonStanding} title="Adults" risk={data.demographics.adult} />
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.pollutants}>
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDarkMode ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)', color: isDarkMode ? '#fff' : '#000', backdropFilter: 'blur(10px)' }} />
                    <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                      {data.pollutants.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? (isDarkMode ? '#38bdf8' : '#0ea5e9') : (isDarkMode ? '#34d399' : '#10b981')} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        <div className="w-full">
          <MLSimulator liveWeather={data ? data.weather : null} />
        </div>

        <div className="w-full">
          <MapRouter />
        </div>

      </div>
    </div>
  );
}