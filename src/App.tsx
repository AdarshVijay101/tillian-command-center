import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { HeroCard } from './components/dashboard/HeroCard';
import { ProtocolCard } from './components/dashboard/ProtocolCard';
import { RiskRadar } from './components/dashboard/RiskRadar';
import { Timeline } from './components/dashboard/Timeline';
import { MemoryVault } from './components/dashboard/MemoryVault';
import { Scheduler } from './components/dashboard/Scheduler';
import { SystemDoctor } from './components/dashboard/SystemDoctor';
import { MissionLog } from './components/dashboard/MissionLog';
import { Analytics } from './components/dashboard/Analytics';
import { Workflow } from './components/dashboard/Workflow';
import { SetupGuide } from './components/dashboard/SetupGuide';
import { CheckIn } from './components/dashboard/CheckIn';
import { Protocols } from './components/dashboard/Protocols';
import { Notifications } from './components/dashboard/Notifications';
import { Reliability } from './components/dashboard/Reliability';
import { Jobs } from './components/dashboard/Jobs';
import { MissionControl } from './components/dashboard/MissionControl';
import { ReviewInbox } from './components/dashboard/ReviewInbox';
import Evidence from './components/dashboard/Evidence';
import Release from './components/dashboard/Release';
import { ActionOutputDrawer } from './components/ui/ActionOutputDrawer';
import { useAgentActions } from './hooks/useAgentActions';
import { motion } from 'framer-motion';
import { Code, Dumbbell, Sparkles, BookOpen } from 'lucide-react';
import { api } from './services/api';
import { useState, useEffect } from 'react';
import Settings from './components/dashboard/Settings';
import { TelegramStudio } from './components/dashboard/TelegramStudio';
import { AssistantHomePanel } from './components/dashboard/AssistantHomePanel';

function App() {
  const { actionState, drawerOpen, currentActionName, startTime, confirmLaunch, cancelLaunch, execute, openRun, closeDrawer } = useAgentActions();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);
  
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        <TopBar />
        
        {/* Scrollable Dashboard Area */}
        <main className="flex-1 overflow-y-auto p-8 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8 pb-20">
            
            {activeTab === 'doctor' ? (
              <SystemDoctor onRunAction={(name, apiCall) => execute(name, apiCall)} />
            ) : activeTab === 'mission-control' ? (
              <MissionControl />
            ) : activeTab === 'jobs' ? (
              <Jobs />
            ) : activeTab === 'review-inbox' ? (
              <ReviewInbox />
            ) : activeTab === 'evidence' ? (
              <Evidence />
            ) : activeTab === 'checkin' ? (
              <CheckIn />
            ) : activeTab === 'release' ? (
              <Release />
            ) : activeTab === 'protocols' ? (
              <Protocols />
            ) : activeTab === 'log' ? (
              <MissionLog onOpenRun={openRun} />
            ) : activeTab === 'analytics' ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Analytics />
              </motion.div>
            ) : activeTab === 'workflow' ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Workflow />
              </motion.div>
            ) : activeTab === 'notifications' ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Notifications />
              </motion.div>
            ) : activeTab === 'scheduler' ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Scheduler />
              </motion.div>
            ) : activeTab === 'reliability' ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Reliability setActiveTab={setActiveTab} />
              </motion.div>
            ) : activeTab === 'setup' ? (
              <SetupGuide onRunAction={(name, apiCall) => execute(name, apiCall)} />
            ) : activeTab === 'settings' ? (
              <Settings />
            ) : activeTab === 'telegram-studio' ? (
              <TelegramStudio />
            ) : (
              <>
                {/* Hero Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <HeroCard 
                onNavigateToMissionControl={() => setActiveTab('mission-control')} 
                onGoToCheckIn={() => setActiveTab('checkin')}
              />
                
                {/* Assistant Home Panel */}
                <AssistantHomePanel />
                
                {/* Protocol Quick-Launch row */}
            </motion.div>

            {/* Mid Section Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Protocol Cards (Left 2/3) */}
              <motion.div 
                className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <ProtocolCard 
                  title="Work Protocol"
                  icon={Code}
                  status="OpenClaw / Local AI Build"
                  next="Demo Prep"
                  mode="FOCUS"
                  glowColor="cyan"
                  statusType="active"
                />
                <ProtocolCard 
                  title="Body Protocol"
                  icon={Dumbbell}
                  status="Shoulders + Traps"
                  next="6:50 AM Gym Reminder"
                  mode="NORMAL"
                  glowColor="emerald"
                  statusType="success"
                />
                <ProtocolCard 
                  title="Skin Protocol"
                  icon={Sparkles}
                  status="Adapalene Night"
                  next="9:30 PM"
                  mode="ACTIVE CARE"
                  glowColor="purple"
                  statusType="info"
                />
                <ProtocolCard 
                  title="Study Protocol"
                  icon={BookOpen}
                  status="3 blocks planned"
                  next="11:15 AM"
                  mode="DEEP WORK"
                  glowColor="blue"
                  statusType="info"
                />
              </motion.div>

              {/* Risk Radar (Right 1/3) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <RiskRadar />
              </motion.div>

            </div>

            {/* Bottom Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Timeline onRunAction={(name, mode) => {
                if (['late_wakeup', 'tired', 'skin_irritated', 'employer_meeting', 'skip_gym'].includes(mode)) {
                  execute(`Adjustment: ${name}`, () => api.sendDynamicAdjustment(mode));
                } else {
                  execute(`Routine: ${name}`, () => api.sendRoutineReminder(mode));
                }
              }} />
            </motion.div>

            {/* Memory Vault Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="pt-8"
            >
              <MemoryVault />
            </motion.div>
              </>
            )}

          </div>
        </main>
      </div>

      {/* Global Drawer */}
      <ActionOutputDrawer 
        isOpen={drawerOpen} 
        onClose={closeDrawer}
        actionName={currentActionName}
        state={actionState}
        startTime={startTime}
        onConfirm={confirmLaunch}
        onCancel={cancelLaunch}
      />
    </div>
  );
}

export default App;

