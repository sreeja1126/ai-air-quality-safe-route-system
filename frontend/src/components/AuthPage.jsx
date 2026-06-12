import React, { useState } from 'react';
import { Wind, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { registerUser, loginUser } from '../services/api'; // <-- IMPORT IS HERE

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [errorMsg, setErrorMsg] = useState(''); 
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      // <-- PROPER LOGIC SPLIT IS HERE
      if (isLogin) {
        const data = await loginUser(email, password);
        onLogin(data.name, data.token); 
      } else {
        const data = await registerUser(name, email, password);
        onLogin(data.name, data.token); 
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.detail || "Connection to database failed.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden font-sans selection:bg-cyan-200 p-4">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-50 animate-pulse duration-[10000ms]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-40"></div>

      <div className="w-full max-w-md relative z-10">
        
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-gradient-to-br from-cyan-500 to-emerald-500 p-4 rounded-2xl shadow-xl shadow-cyan-200/50 mb-4">
            <Wind className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">EcoPath<span className="text-emerald-500 font-light">AI</span></h1>
          <p className="text-slate-500 font-medium mt-2 text-center">Breathe easier. Navigate smarter.</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-8">
            <ShieldCheck className="w-6 h-6 text-cyan-500" />
            <h2 className="text-2xl font-bold text-slate-800">{isLogin ? 'Welcome Back' : 'Join the Network'}</h2>
          </div>

          {errorMsg && (
            <div className="bg-rose-100 border border-rose-200 text-rose-600 text-sm font-bold p-3 rounded-xl mb-6 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {!isLogin && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-slate-700 font-medium"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@ecopath.ai"
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-slate-700 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-slate-700 font-medium"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-cyan-600 disabled:bg-slate-400 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4 shadow-lg"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In to Dashboard' : 'Create Account')} 
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
              }}
              className="text-sm font-bold text-slate-500 hover:text-cyan-600 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}