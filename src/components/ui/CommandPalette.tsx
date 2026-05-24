import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CalendarClock, Code, CheckSquare, Settings as SettingsIcon, MessageSquare } from 'lucide-react';
import { navItems } from '../layout/Sidebar';
import { api } from '../../services/api';

const actions = [
  { id: 'action-daily-planner', label: 'Run Daily Planner', icon: CalendarClock, type: 'action', action: async () => {
    // Attempt to run the daily planner template
    const templatesRes = await api.getMissionTemplates();
    if (templatesRes.ok) {
      const templates = templatesRes.data as any[];
      const planner = templates.find(t => t.id === 'daily_planner');
      if (planner) {
        await api.createJobFromMissionTemplate(planner.id);
      }
    }
  }},
  { id: 'action-morning-brief', label: 'Morning Brief', icon: CheckSquare, type: 'action', action: async () => {
    const templatesRes = await api.getMissionTemplates();
    if (templatesRes.ok) {
      const templates = templatesRes.data as any[];
      const brief = templates.find(t => t.id === 'morning_brief');
      if (brief) {
        await api.createJobFromMissionTemplate(brief.id);
      }
    }
  }},
  { id: 'action-sync-reviews', label: 'Sync Artifact Reviews', icon: Code, type: 'action', action: async () => {
    await api.syncArtifactReviews();
  }},
];

export const CommandPalette = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine pages and actions
  const pages = navItems.map(item => ({
    ...item,
    type: 'page'
  }));
  
  // Add hardcoded extra routes
  pages.push({ id: 'settings', icon: SettingsIcon, label: 'SETTINGS', type: 'page' });
  pages.push({ id: 'telegram-studio', icon: MessageSquare, label: 'TELEGRAM STUDIO', type: 'page' });

  const filteredItems = [...pages, ...actions].filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems.length > 0) {
          handleSelect(filteredItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  const handleSelect = async (item: any) => {
    if (item.type === 'page') {
      window.dispatchEvent(new CustomEvent('navigate', { detail: item.id }));
    } else if (item.type === 'action' && item.action) {
      await item.action();
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'mission-control' }));
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[500px] bg-[#111113] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[101]"
          >
            <div className="flex items-center px-4 py-3 border-b border-white/5 bg-black/20">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search pages or run actions..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 font-medium"
              />
              <div className="flex gap-1 ml-2">
                <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-gray-400">ESC</kbd>
                <span className="text-[10px] text-gray-500">to close</span>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto py-2">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No results found for "{query}"
                </div>
              ) : (
                filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => handleSelect(item)}
                      className={`flex items-center px-4 py-3 cursor-pointer mx-2 rounded-lg transition-colors ${
                        isSelected ? 'bg-primary/20 text-primary' : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-3 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className={`ml-auto text-[10px] uppercase tracking-wider ${isSelected ? 'text-primary/70' : 'text-gray-500'}`}>
                        {item.type}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
