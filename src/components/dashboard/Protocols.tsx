import { useEffect, useState } from 'react';
import { BookOpen, Activity, Droplets, Sun, Moon, BrainCircuit, Calendar, ChevronDown, ChevronUp, Send, Copy } from 'lucide-react';
import { api } from '../../services/api';

const ProtocolCard = ({ protocol, icon: Icon, colorClass }: { protocol: any, icon: any, colorClass: string }) => {
  const [expanded, setExpanded] = useState(false);

  if (!protocol) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-4 transition-all">
      <div 
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-white/5 ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{protocol.title}</h3>
            <p className="text-sm text-gray-400">{protocol.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {protocol.estimated_minutes && (
            <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded">~{protocol.estimated_minutes}m</span>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>
      
      {expanded && (
        <div className="p-5 border-t border-white/10 bg-black/20">
          {protocol.safety_notes && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-200">
              <span className="font-bold text-red-400">Safety Note:</span> {protocol.safety_notes}
            </div>
          )}
          
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-300 mb-3 text-sm uppercase tracking-wider">Protocol Steps</h4>
            {protocol.steps?.map((step: any, idx: number) => (
              <div key={step.id} className="flex items-start gap-3 p-2 hover:bg-white/5 rounded-lg">
                <span className="text-gray-500 font-mono text-sm mt-0.5">{idx + 1}.</span>
                <div>
                  <p className="font-medium text-gray-200">{step.title}</p>
                  {step.description && <p className="text-sm text-gray-400 mt-1">{step.description}</p>}
                </div>
              </div>
            ))}
            {(!protocol.steps || protocol.steps.length === 0) && (
              <p className="text-gray-500 italic text-sm">No specific steps defined.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const Protocols = () => {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reminderTypes, setReminderTypes] = useState<string[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string>('gym');
  const [previewData, setPreviewData] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getTodayRoutinePlan(),
      api.getReminderTypes()
    ]).then(([planRes, typesRes]) => {
      if (planRes.ok) setPlan(planRes.data);
      if (typesRes.ok) {
        setReminderTypes((typesRes.data as any).types || []);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedPreview) {
      api.getReminderPreview(selectedPreview).then(res => {
        if (res.ok) setPreviewData(res.data);
      });
    }
  }, [selectedPreview, plan]); // re-fetch if plan overrides change

  const handleCopyPreview = () => {
    if (previewData?.message) {
      navigator.clipboard.writeText(previewData.message);
    }
  };

  const handleSendTest = async () => {
    if (!selectedPreview || isSending) return;
    setIsSending(true);
    await api.sendRoutineReminder(selectedPreview);
    window.dispatchEvent(new Event('Local AI:refresh'));
    setIsSending(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading protocol matrix...</div>;
  }

  if (!plan) {
    return <div className="p-8 text-center text-red-400">Failed to load routine plan. Check backend connection.</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Protocol Library</h1>
          <p className="text-gray-400 mt-1">Adaptive Routine Engine - {plan.dayOfWeek}, {plan.date}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm">
          <BrainCircuit className="w-4 h-4" />
          <span>Engine Active</span>
        </div>
      </div>

      {plan.warnings && plan.warnings.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-2">
          <h3 className="font-bold text-yellow-500 flex items-center gap-2">
            <Activity className="w-5 h-5" /> Dynamic Adjustments Active
          </h3>
          <ul className="list-disc pl-5 text-sm text-yellow-200 space-y-1">
            {plan.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-300">
              <Activity className="w-5 h-5" /> Gym Protocol
            </h2>
            <ProtocolCard protocol={plan.gymProtocol} icon={Activity} colorClass="text-indigo-400" />
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-300">
              <Droplets className="w-5 h-5" /> Skincare Protocols
            </h2>
            <ProtocolCard protocol={plan.skincareProtocol?.morning} icon={Sun} colorClass="text-emerald-400" />
            <ProtocolCard protocol={plan.skincareProtocol?.night} icon={Moon} colorClass="text-emerald-400" />
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-300">
              <Activity className="w-5 h-5" /> Body Care
            </h2>
            {plan.bodyCare?.map((bc: any) => (
              <ProtocolCard key={bc.id} protocol={bc} icon={Droplets} colorClass="text-blue-400" />
            ))}
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" /> Study Blocks
            </h3>
            <div className="space-y-3">
              {plan.studyBlocks?.map((sb: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg text-sm">
                  <span className="font-medium text-gray-300">{sb.label}</span>
                  <span className="font-mono text-gray-500">{sb.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" /> Food Prep
            </h3>
            <div className="space-y-3">
              {plan.foodBlocks?.map((fb: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg text-sm">
                  <span className="font-medium text-gray-300">{fb.label}</span>
                  <span className="font-mono text-gray-500">{fb.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-300" /> Sleep Routine
            </h3>
            <div className="space-y-3">
              {plan.sleepRoutine?.map((sr: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg text-sm">
                  <span className="font-medium text-gray-300">{sr.label}</span>
                  <span className="font-mono text-gray-500">{sr.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Telegram Preview Section */}
      <div className="mt-8 bg-[#111113] border border-white/5 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
          <Send className="w-5 h-5" /> Telegram Message Preview
        </h2>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3 space-y-4">
            <p className="text-sm text-gray-400">
              Local AI securely orchestrates local PowerShell scripts to deliver these dynamically built payloads via Telegram, ensuring API tokens remain 100% detached from this web dashboard.
            </p>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Select Reminder Protocol</label>
              <select 
                value={selectedPreview}
                onChange={(e) => setSelectedPreview(e.target.value)}
                className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500/50"
              >
                {reminderTypes.map(rt => (
                  <option key={rt} value={rt}>{rt.replace(/_/g, ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleCopyPreview}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center gap-2 text-sm text-gray-300 transition-colors"
              >
                <Copy className="w-4 h-4" /> Copy Message
              </button>
              <button 
                onClick={handleSendTest}
                disabled={isSending}
                className="flex-1 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-lg flex items-center justify-center gap-2 text-sm text-indigo-300 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> {isSending ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
          <div className="lg:w-2/3 bg-black/40 border border-white/5 rounded-xl p-4 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
            {previewData ? (
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                {previewData.message}
              </pre>
            ) : (
              <div className="h-full min-h-[150px] flex items-center justify-center text-gray-500 text-sm italic">
                Loading preview...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

