import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun,
  Moon,
  Activity, 
  Plus, 
  User as UserIcon, 
  LogOut, 
  ChevronRight, 
  Camera, 
  MessageSquare, 
  TrendingUp,
  Calendar,
  Utensils,
  X,
  Send,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { User, CalorieLog } from './types';
import { analyzeFoodImage, getHealthAdvice } from './services/geminiService';

// --- Components ---

const SimpleCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`card ${className}`}
  >
    {children}
  </motion.div>
);

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-sm font-medium opacity-60 ml-1">{label}</label>}
    <input className="input-field" {...props} />
  </div>
);

// --- Pages ---

const Login = ({ onLogin }: { onLogin: (data: any) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data);
        navigate('/');
      } else {
        alert(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <SimpleCard className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tighter mb-2">CaloGlass</h1>
          <p className="opacity-60">Your minimalist AI health companion</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary mt-4" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Login'}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-white/60">
          Don't have an account? <Link to="/signup" className="text-orange-500 font-semibold">Sign up</Link>
        </p>
      </SimpleCard>
    </div>
  );
};

const Signup = ({ onLogin }: { onLogin: (data: any) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data);
        navigate('/onboarding');
      } else {
        alert(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <SimpleCard className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tighter mb-2">Join CaloGlass</h1>
          <p className="opacity-60">Start your journey to a healthier you</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Name" type="text" value={name} onChange={(e: any) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary mt-4" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Create Account'}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-white/60">
          Already have an account? <Link to="/login" className="text-orange-500 font-semibold">Login</Link>
        </p>
      </SimpleCard>
    </div>
  );
};

const Onboarding = ({ user, onUpdate }: { user: User, onUpdate: (u: User) => void }) => {
  const [age, setAge] = useState(user.age || 25);
  const [gender, setGender] = useState(user.gender || 'male');
  const [weight, setWeight] = useState(user.weight || 70);
  const [height, setHeight] = useState(user.height || 175);
  const [activity, setActivity] = useState(user.activity_level || 'moderate');
  const navigate = useNavigate();

  const calculateTarget = () => {
    // Basic Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;
    
    const multipliers: any = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    return Math.round(bmr * multipliers[activity]);
  };

  const handleSave = async () => {
    const target = calculateTarget();
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ age, gender, weight, height, activity_level: activity, target_calories: target }),
    });
    if (res.ok) {
      onUpdate({ ...user, age, gender, weight, height, activity_level: activity, target_calories: target });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black/5">
      <SimpleCard className="w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">Setup Your Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Age" type="number" value={age} onChange={(e: any) => setAge(Number(e.target.value))} />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium opacity-60 ml-1">Gender</label>
            <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <Input label="Weight (kg)" type="number" value={weight} onChange={(e: any) => setWeight(Number(e.target.value))} />
          <Input label="Height (cm)" type="number" value={height} onChange={(e: any) => setHeight(Number(e.target.value))} />
          <div className="col-span-2 flex flex-col gap-2">
            <label className="text-sm font-medium opacity-60 ml-1">Activity Level</label>
            <select className="input-field" value={activity} onChange={(e) => setActivity(e.target.value)}>
              <option value="sedentary">Sedentary (Office job)</option>
              <option value="light">Lightly Active</option>
              <option value="moderate">Moderately Active</option>
              <option value="active">Active</option>
              <option value="very_active">Very Active</option>
            </select>
          </div>
        </div>
        <button onClick={handleSave} className="btn-primary w-full mt-8">
          Calculate & Start
        </button>
      </SimpleCard>
    </div>
  );
};

const Dashboard = ({ user, logs, onAddLog, theme, onToggleTheme }: { user: User, logs: CalorieLog[], onAddLog: (log: any) => void, theme: string, onToggleTheme: () => void }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.date === today);
  const consumed = todayLogs.reduce((acc, curr) => acc + curr.calories, 0);
  const remaining = (user.target_calories || 2000) - consumed;
  const progress = Math.min((consumed / (user.target_calories || 2000)) * 100, 100);

  // Chart Data (Last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logs.filter(l => l.date === dateStr);
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      calories: dayLogs.reduce((acc, curr) => acc + curr.calories, 0),
      date: dateStr
    };
  }).reverse();

  const handleAddLog = async () => {
    if (!foodName || !calories) return;
    setLoading(true);
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ food_name: foodName, calories: Number(calories), date: today }),
    });
    if (res.ok) {
      onAddLog({ food_name: foodName, calories: Number(calories), date: today });
      setFoodName('');
      setCalories('');
      setShowAdd(false);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const result = await analyzeFoodImage(base64);
        setFoodName(result.food_name);
        setCalories(result.calories.toString());
        setShowAdd(true);
      } catch (err) {
        alert("Failed to analyze image. Try manual entry.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Hello, {user.name}</h1>
          <p className="opacity-60 text-sm">Track your progress today</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center hover:opacity-80 transition-all"
          >
            {theme === 'dark' ? <Sun size={20} className="text-orange-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center">
            <UserIcon size={20} />
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <SimpleCard className="mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Activity size={80} />
        </div>
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="opacity-60 text-sm uppercase tracking-wider font-semibold">Remaining</p>
            <h2 className="text-5xl font-bold tracking-tighter">{remaining} <span className="text-lg font-normal opacity-40">kcal</span></h2>
          </div>
          <div className="text-right">
            <p className="opacity-60 text-sm">Goal: {user.target_calories} kcal</p>
          </div>
        </div>
        <div className="h-3 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-orange-500"
          />
        </div>
      </SimpleCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button onClick={() => setShowAdd(true)} className="card p-4 rounded-2xl flex items-center gap-3 hover:opacity-80 transition-all">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Plus size={20} />
          </div>
          <span className="font-semibold">Add Meal</span>
        </button>
        <label className="card p-4 rounded-2xl flex items-center gap-3 hover:opacity-80 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Camera size={20} />
          </div>
          <span className="font-semibold">Scan Food</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
      </div>

      {/* Chart */}
      <SimpleCard className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold flex items-center gap-2"><TrendingUp size={18} className="text-orange-500" /> Weekly Summary</h3>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days}>
              <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                {last7Days.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.calories > (user.target_calories || 2000) ? '#ef4444' : '#f97316'} />
                ))}
              </Bar>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SimpleCard>

      {/* Today's Logs */}
      <div className="mb-8">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Utensils size={18} className="text-orange-500" /> Today's Meals</h3>
        <div className="flex flex-col gap-3">
          {todayLogs.length === 0 ? (
            <p className="opacity-40 text-center py-8 card rounded-2xl">No meals logged yet today.</p>
          ) : (
            todayLogs.map(log => (
              <div key={log.id} className="card p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-semibold">{log.food_name}</p>
                  <p className="text-xs opacity-40">Logged at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <p className="font-bold text-orange-500">{log.calories} kcal</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Chat Button */}
      <button 
        onClick={() => setShowChat(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-orange-600 shadow-2xl shadow-orange-600/40 flex items-center justify-center hover:scale-110 transition-all active:scale-95 z-40"
      >
        <MessageSquare size={28} />
      </button>

      {/* Add Meal Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="card w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add Meal</h2>
                <button onClick={() => setShowAdd(false)} className="p-2 hover:opacity-80 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <Input label="Food Name" placeholder="e.g. Avocado Toast" value={foodName} onChange={(e: any) => setFoodName(e.target.value)} />
                <Input label="Calories" type="number" placeholder="e.g. 350" value={calories} onChange={(e: any) => setCalories(e.target.value)} />
                <button onClick={handleAddLog} className="btn-primary w-full mt-4" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Save Meal'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowChat(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-lg h-[80vh] rounded-[32px] flex flex-col relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold">CaloAI Assistant</h2>
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="p-2 hover:opacity-80 rounded-full">
                  <X size={24} />
                </button>
              </div>
              
              <ChatInterface user={user} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="font-semibold">Analyzing your food...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatInterface = ({ user }: { user: User }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: `Hi ${user.name}! I'm your health assistant. How can I help you reach your goal of ${user.target_calories} kcal today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await getHealthAdvice(userMsg, user);
      setMessages(prev => [...prev, { role: 'ai', text: response || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to AI. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-orange-600 text-white rounded-tr-none' : 'card opacity-90 rounded-tl-none'}`}>
              <p className="text-sm leading-relaxed">{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="card p-4 rounded-2xl rounded-tl-none">
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            </div>
          </div>
        )}
      </div>
      <div className="p-6 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
        <div className="relative">
          <input 
            className="input-field w-full pr-12" 
            placeholder="Ask anything about health..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center hover:bg-orange-400 transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<CalorieLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile(token);
      fetchLogs(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (token: string) => {
    const res = await fetch('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
    }
    setLoading(false);
  };

  const fetchLogs = async (token: string) => {
    const res = await fetch('/api/logs', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setLogs(data);
    }
  };

  const handleLogin = (data: any) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
    fetchLogs(data.token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setLogs([]);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup onLogin={handleLogin} />} />
      <Route path="/onboarding" element={user ? <Onboarding user={user} onUpdate={setUser} /> : <Navigate to="/login" />} />
      <Route path="/" element={
        user ? (
          user.age ? (
            <Dashboard 
              user={user} 
              logs={logs} 
              onAddLog={(log) => setLogs([log, ...logs])} 
              theme={theme}
              onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            />
          ) : (
            <Navigate to="/onboarding" />
          )
        ) : (
          <Navigate to="/login" />
        )
      } />
    </Routes>
  );
}
