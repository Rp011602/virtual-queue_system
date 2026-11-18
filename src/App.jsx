import React, { useState, useMemo } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  UserX, 
  Sparkles, 
  LogOut, 
  Volume2, 
  RotateCcw,
  Coffee,
  Check,
  PhoneCall,
  Flame,
  PlusCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react';

const INITIAL_CURRENT_SERVING = {
  id: 'tkt-101',
  name: 'Rahul Sharma',
  phone: '+91 98765-43210',
  token: 'A-101',
  joinedAt: '10:15 AM'
};

const INITIAL_WAITING_QUEUE = [
  { id: 'tkt-102', name: 'Priya Patel', phone: '+91 98234-56789', token: 'A-102', joinedAt: '10:18 AM' },
  { id: 'tkt-103', name: 'Amit Verma', phone: '+91 98123-45678', token: 'A-103', joinedAt: '10:22 AM' },
  { id: 'tkt-104', name: 'Neha Gupta', phone: '+91 98987-65432', token: 'A-104', joinedAt: '10:25 AM' }
];

export default function App() {
  const [viewMode, setViewMode] = useState('customer'); // 'customer' | 'admin'
  const [currentlyServing, setCurrentlyServing] = useState(INITIAL_CURRENT_SERVING);
  const [waitingQueue, setWaitingQueue] = useState(INITIAL_WAITING_QUEUE);
  const [heldQueue, setHeldQueue] = useState([]);
  const [completedCount, setCompletedCount] = useState(18);
  const [nextSeqNumber, setNextSeqNumber] = useState(105);

  // Customer Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [myTicket, setMyTicket] = useState(null);
  const [recentNotification, setRecentNotification] = useState('');

  const AVG_SERVICE_MINUTES = 4;

  const notify = (msg) => {
    setRecentNotification(msg);
    setTimeout(() => setRecentNotification(''), 4500);
  };

  // Dynamic status computation for active customer ticket
  const customerStatus = useMemo(() => {
    if (!myTicket) return null;

    if (currentlyServing?.id === myTicket.id) {
      return {
        status: 'SERVING',
        peopleAhead: 0,
        estimatedWait: 0,
        progressPercent: 100
      };
    }

    const pos = waitingQueue.findIndex((item) => item.id === myTicket.id);
    if (pos !== -1) {
      const peopleAhead = pos + (currentlyServing ? 1 : 0);
      const estimatedWait = peopleAhead * AVG_SERVICE_MINUTES;
      const progressPercent = Math.max(15, Math.min(90, 100 - peopleAhead * 15));
      return {
        status: 'WAITING',
        peopleAhead,
        estimatedWait,
        progressPercent
      };
    }

    const isHeld = heldQueue.some((item) => item.id === myTicket.id);
    if (isHeld) {
      return {
        status: 'HELD',
        peopleAhead: null,
        estimatedWait: null,
        progressPercent: 50
      };
    }

    return {
      status: 'COMPLETED',
      peopleAhead: 0,
      estimatedWait: 0,
      progressPercent: 100
    };
  }, [myTicket, currentlyServing, waitingQueue, heldQueue]);

  // Customer actions
  const handleJoinQueue = (e) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const token = `A-${nextSeqNumber}`;
    const newEntry = {
      id: `tkt-${nextSeqNumber}`,
      name: customerName.trim(),
      phone: customerPhone.trim() || '+91 99999-00000',
      token,
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setWaitingQueue((prev) => [...prev, newEntry]);
    setMyTicket(newEntry);
    setNextSeqNumber((prev) => prev + 1);
    setCustomerName('');
    setCustomerPhone('');
    notify(`🎉 Welcome ${newEntry.name}! Assigned Token #${token}`);
  };

  const handleLeaveQueue = () => {
    if (!myTicket) return;
    setWaitingQueue((prev) => prev.filter((item) => item.id !== myTicket.id));
    setHeldQueue((prev) => prev.filter((item) => item.id !== myTicket.id));
    if (currentlyServing?.id === myTicket.id) {
      setCurrentlyServing(null);
    }
    setMyTicket(null);
    notify('You left the queue.');
  };

  // Admin actions
  const handleCallNext = () => {
    if (waitingQueue.length === 0) {
      if (currentlyServing) {
        setCompletedCount((prev) => prev + 1);
        setCurrentlyServing(null);
        notify('Queue empty! All waiting customers are served.');
      }
      return;
    }

    if (currentlyServing) {
      setCompletedCount((prev) => prev + 1);
    }

    const [nextPerson, ...remaining] = waitingQueue;
    setCurrentlyServing(nextPerson);
    setWaitingQueue(remaining);

    // Audio chime simulation via Web Audio API
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (_) {}

    notify(`🔔 Token ${nextPerson.token} (${nextPerson.name}) Called!`);
  };

  const handleSkipOrHold = () => {
    if (!currentlyServing) return;
    const skipped = currentlyServing;
    setHeldQueue((prev) => [...prev, skipped]);
    setCurrentlyServing(null);
    notify(`⏸️ Token ${skipped.token} moved to Hold.`);
  };

  const handleResumeHeld = (ticketId) => {
    const item = heldQueue.find((t) => t.id === ticketId);
    if (!item) return;
    setHeldQueue((prev) => prev.filter((t) => t.id !== ticketId));
    setWaitingQueue((prev) => [item, ...prev]);
    notify(`Token ${item.token} re-inserted to queue front.`);
  };

  const handleQuickAddRandom = () => {
    const names = ['Kavita Roy', 'Vikram Singh', 'Ananya Deshmukh', 'Rohan Mehta', 'Deepak Chopra'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const token = `A-${nextSeqNumber}`;
    const newEntry = {
      id: `tkt-${nextSeqNumber}`,
      name: randomName,
      phone: '+91 98111-22334',
      token,
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setWaitingQueue((prev) => [...prev, newEntry]);
    setNextSeqNumber((prev) => prev + 1);
    notify(`Added ${randomName} (${token}) to queue.`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
              Q
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-tight">QueuePulse</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Smart Virtual Queue Management</p>
            </div>
          </div>

          {/* Toggle between Customer View and Admin View */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
            <button
              onClick={() => setViewMode('customer')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                viewMode === 'customer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customer View</span>
            </button>
            <button
              onClick={() => setViewMode('admin')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                viewMode === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
              {waitingQueue.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Real-time Notification Banner */}
        {recentNotification && (
          <div className="bg-indigo-600 text-white text-xs sm:text-sm font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 animate-pulse">
            <Volume2 className="w-4 h-4" />
            <span>{recentNotification}</span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {viewMode === 'customer' ? (
          /* ==================================================== */
          /* CUSTOMER INTERFACE                                  */
          /* ==================================================== */
          <div className="w-full max-w-md mx-auto">
            {!myTicket ? (
              <div className="bg-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-3xl mb-3 border border-indigo-500/20">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Join Virtual Line</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Enter your name to take your digital token and track your turn in real time.
                  </p>
                </div>

                <form onSubmit={handleJoinQueue} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sahil Khan"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765-43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95"
                  >
                    <span>Get Instant Token</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Currently Serving:</span>
                  <span className="font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl">
                    {currentlyServing ? currentlyServing.token : 'Counter Idle'}
                  </span>
                </div>
              </div>
            ) : (
              /* Active Token Dashboard */
              <div className="space-y-4">
                <div className="bg-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700 text-center relative overflow-hidden">
                  {/* Subtle Background Glow */}
                  <div
                    className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-30 ${
                      customerStatus?.status === 'SERVING' ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                  />

                  {/* Status Pill */}
                  <div className="flex justify-center mb-4">
                    {customerStatus?.status === 'SERVING' && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-bounce">
                        <CheckCircle2 className="w-4 h-4" />
                        It's Your Turn Now!
                      </span>
                    )}
                    {customerStatus?.status === 'WAITING' && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping mr-0.5" />
                        Waiting in Line
                      </span>
                    )}
                    {customerStatus?.status === 'HELD' && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Token on Hold
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Your Token Number
                  </p>
                  <h1 className="text-6xl font-black text-white tracking-tight my-2">
                    {myTicket.token}
                  </h1>
                  <p className="text-sm font-semibold text-slate-300">Name: {myTicket.name}</p>

                  {/* Serving Announcement */}
                  <div className="mt-5 bg-slate-900/60 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Currently Serving at Counter:</span>
                    <span className="text-sm font-extrabold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
                      {currentlyServing ? currentlyServing.token : 'Counter Idle'}
                    </span>
                  </div>

                  {/* Real-time Cards */}
                  {customerStatus?.status === 'WAITING' && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
                        <div className="flex justify-center text-indigo-400 mb-1">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="text-3xl font-black text-white">
                          {customerStatus.peopleAhead}
                        </div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                          {customerStatus.peopleAhead === 1 ? 'Person Ahead' : 'People Ahead'}
                        </div>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                        <div className="flex justify-center text-amber-400 mb-1">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="text-3xl font-black text-white">
                          ~{customerStatus.estimatedWait}m
                        </div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                          Est. Wait Time
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Turn Notification Callout */}
                  {customerStatus?.status === 'SERVING' && (
                    <div className="mt-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/30">
                      <div className="flex items-center justify-center gap-2 font-black text-base">
                        <PhoneCall className="w-5 h-5 animate-pulse" />
                        <span>Please Approach Counter #1</span>
                      </div>
                      <p className="text-xs text-emerald-100 mt-1">
                        The executive is ready to assist you right now.
                      </p>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-6 text-left">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                      <span>Queue Progress</span>
                      <span>{customerStatus?.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          customerStatus?.status === 'SERVING'
                            ? 'bg-emerald-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${customerStatus?.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleLeaveQueue}
                    className="mt-6 text-xs text-slate-400 hover:text-rose-400 font-bold flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Leave Queue / Clear Ticket</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ==================================================== */
          /* ADMIN DASHBOARD                                      */
          /* ==================================================== */
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/90 p-5 rounded-3xl border border-slate-700 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{waitingQueue.length}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total In Queue
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/90 p-5 rounded-3xl border border-slate-700 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{AVG_SERVICE_MINUTES} min</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Avg Service Pace
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/90 p-5 rounded-3xl border border-slate-700 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">
                    {waitingQueue.length * AVG_SERVICE_MINUTES} min
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Clearance Time
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/90 p-5 rounded-3xl border border-slate-700 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{completedCount}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Served Today
                  </div>
                </div>
              </div>
            </div>

            {/* Split Screen Control */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Control Pod */}
              <div className="bg-slate-800/90 p-6 rounded-3xl border border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Counter Status
                    </span>
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  </div>

                  {currentlyServing ? (
                    <div className="my-6 text-center py-6 px-4 bg-slate-900/60 border border-indigo-500/20 rounded-3xl">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                        Currently Serving
                      </span>
                      <h2 className="text-5xl font-black text-white tracking-tight mt-3">
                        {currentlyServing.token}
                      </h2>
                      <p className="text-base font-bold text-slate-200 mt-2">{currentlyServing.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{currentlyServing.phone}</p>
                      <p className="text-[11px] text-slate-500 mt-1">Joined at {currentlyServing.joinedAt}</p>
                    </div>
                  ) : (
                    <div className="my-6 text-center py-10 bg-slate-900/40 border border-dashed border-slate-700 rounded-3xl">
                      <Coffee className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-300">Counter is Idle</p>
                      <p className="text-xs text-slate-500 mt-0.5">Click "Call Next" to serve the next customer.</p>
                    </div>
                  )}
                </div>

                {/* Operations */}
                <div className="space-y-3 pt-4 border-t border-slate-700">
                  <button
                    onClick={handleCallNext}
                    disabled={waitingQueue.length === 0 && !currentlyServing}
                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Call Next Customer</span>
                  </button>

                  <button
                    onClick={handleSkipOrHold}
                    disabled={!currentlyServing}
                    className="w-full py-3 bg-slate-700/60 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Hold / Skip Current Token</span>
                  </button>

                  <button
                    onClick={handleQuickAddRandom}
                    className="w-full py-2.5 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white font-medium rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Simulate Incoming Customer</span>
                  </button>
                </div>
              </div>

              {/* Right Live Table */}
              <div className="lg:col-span-2 bg-slate-800/90 rounded-3xl border border-slate-700 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-white text-base">Live Waiting Queue</h3>
                    <p className="text-xs text-slate-400">Real-time sequence of visitors</p>
                  </div>
                  <span className="text-xs font-bold bg-slate-700 text-slate-300 px-3 py-1 rounded-full">
                    {waitingQueue.length} Waiting
                  </span>
                </div>

                <div className="flex-1 overflow-x-auto">
                  {waitingQueue.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                      <Users className="w-10 h-10 text-slate-600 mb-2 stroke-[1.5]" />
                      <p className="text-sm font-semibold">Queue is empty.</p>
                      <p className="text-xs text-slate-500 mt-0.5">Use "Simulate Incoming Customer" or Customer View.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                        <tr>
                          <th className="py-3 px-6">Queue #</th>
                          <th className="py-3 px-6">Customer Name</th>
                          <th className="py-3 px-6">Token</th>
                          <th className="py-3 px-6">Est. Wait</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {waitingQueue.map((customer, index) => (
                          <tr key={customer.id} className="hover:bg-slate-750 transition-colors">
                            <td className="py-4 px-6 font-bold text-slate-400">#{index + 1}</td>
                            <td className="py-4 px-6 font-bold text-white">
                              {customer.name}
                              {myTicket?.id === customer.id && (
                                <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                                  YOU
                                </span>
                              )}
                              <div className="text-xs text-slate-400 font-normal">{customer.phone}</div>
                            </td>
                            <td className="py-4 px-6 font-black text-indigo-400">
                              <span className="bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                                {customer.token}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-bold text-amber-400">
                              ~{(index + (currentlyServing ? 1 : 0)) * AVG_SERVICE_MINUTES} min
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Held Section */}
                {heldQueue.length > 0 && (
                  <div className="bg-amber-500/5 border-t border-amber-500/20 p-4 sm:px-6">
                    <div className="text-xs font-black uppercase tracking-wider text-amber-400 mb-2">
                      Held Customers ({heldQueue.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {heldQueue.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 bg-slate-900 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200"
                        >
                          <span className="text-amber-400">{item.token}</span>
                          <span>{item.name}</span>
                          <button
                            onClick={() => handleResumeHeld(item.id)}
                            title="Re-insert to front of queue"
                            className="text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
