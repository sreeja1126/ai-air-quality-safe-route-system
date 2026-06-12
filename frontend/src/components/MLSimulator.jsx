import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BrainCircuit, Wind, ThermometerSun, Factory } from 'lucide-react';
import { predictFutureAQI } from '../services/api'; // Connects to your Python AI!

// 1. NEW: Accept the liveWeather prop from App.jsx
export default function MLSimulator({ liveWeather }) {
  // STATE: Holding our slider values
  const [features, setFeatures] = useState({ pm25: 65, temperature: 25, wind_speed: 10 });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  // 2. NEW: Listen for real city searches and auto-update the sliders!
  useEffect(() => {
    if (liveWeather) {
      setFeatures({
        pm25: liveWeather.pm25, // Assuming Base PM2.5 from the API
        temperature: liveWeather.temperature,
        wind_speed: liveWeather.wind_speed
      });
    }
  }, [liveWeather]);

  // THE AI TRIGGER: Runs every time a slider moves
  useEffect(() => {
    const runPrediction = async () => {
      setLoading(true);
      try {
        // Send data to your Python Random Forest Regressor
        const result = await predictFutureAQI({
          pm25: features.pm25,
          pm10: features.pm25 * 1.5, // Estimated ratio
          no2: 25, 
          temperature: features.temperature,
          humidity: 50, 
          wind_speed: features.wind_speed
        });
        setPrediction(result);
      } catch (error) {
        console.error("AI Engine offline.");
      }
      setLoading(false);
    };
    
    // Add a tiny delay (debounce) so we don't spam the Python server while dragging
    const delay = setTimeout(runPrediction, 300);
    return () => clearTimeout(delay);
  }, [features]);

  // VISUAL MATH: Calculate how much "weight" each feature has for the chart
  // This simulates the internal decision nodes of the Random Forest
  const featureWeights = [
    { name: 'Base Pollution (PM2.5)', weight: features.pm25, fill: '#64748b' }, // Gray
    { name: 'Heat Multiplier', weight: features.temperature * 1.2, fill: '#ef4444' }, // Red (Increases AQI)
    { name: 'Wind Dispersion', weight: -(features.wind_speed * 3), fill: '#3b82f6' } // Blue (Decreases AQI)
  ];

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-sm border border-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-cyan-100 p-2 rounded-xl">
          <BrainCircuit className="w-6 h-6 text-cyan-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">ML Random Forest Simulator</h2>
      </div>
      
      <p className="text-sm text-slate-500 mb-6">
        Adjust the environmental nodes. Watch how the AI's decision trees dynamically weigh these factors to predict the final air quality.
      </p>

      {/* SLIDERS SECTION */}
      <div className="space-y-6 mb-8">
        <div>
          <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-2"><Factory className="w-4 h-4 text-slate-500"/> Baseline PM2.5</span>
            <span className="text-slate-600">{Math.round(features.pm25)} µg/m³</span>
          </div>
          <input type="range" min="10" max="250" value={features.pm25} onChange={(e) => setFeatures({...features, pm25: Number(e.target.value)})} className="w-full accent-slate-600" />
        </div>

        <div>
          <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-2"><ThermometerSun className="w-4 h-4 text-red-500"/> Temperature</span>
            <span className="text-red-600">{Math.round(features.temperature)}°C</span>
          </div>
          <input type="range" min="0" max="45" value={features.temperature} onChange={(e) => setFeatures({...features, temperature: Number(e.target.value)})} className="w-full accent-red-500" />
        </div>

        <div>
          <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-2"><Wind className="w-4 h-4 text-blue-500"/> Wind Speed</span>
            <span className="text-blue-600">{Math.round(features.wind_speed)} km/h</span>
          </div>
          <input type="range" min="0" max="40" value={features.wind_speed} onChange={(e) => setFeatures({...features, wind_speed: Number(e.target.value)})} className="w-full accent-blue-500" />
        </div>
      </div>

      {/* VISUALIZATION SECTION */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">AI Feature Influence Weights</h3>
        <div className="h-40 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={featureWeights} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                {featureWeights.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI OUTPUT */}
        {prediction && (
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Final Predicted AQI</div>
              <div className="text-lg font-bold text-slate-700">{prediction.category}</div>
            </div>
            <div className={`text-4xl font-black ${prediction.predicted_aqi > 150 ? 'text-red-500' : 'text-emerald-500'}`}>
              {loading ? '...' : prediction.predicted_aqi}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}