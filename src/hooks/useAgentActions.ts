import { useState, useRef } from 'react';
import { api } from '../services/api';
import type { ApiResponse } from '../services/api';

export interface ActionState {
  isIdle: boolean;
  isPreflight: boolean;
  isPreflightBlocked: boolean;
  isPreflightPassed: boolean;
  preflightData?: any | null;
  isRunning: boolean;
  isSuccess: boolean;
  isError: boolean;
  result: any | null;
  error: string | null;
  runRecord?: any | null;
}

export function useAgentActions() {
  const defaultState: ActionState = {
    isIdle: true,
    isPreflight: false,
    isPreflightBlocked: false,
    isPreflightPassed: false,
    preflightData: null,
    isRunning: false,
    isSuccess: false,
    isError: false,
    result: null,
    error: null,
    runRecord: null
  };

  const [actionState, setActionState] = useState<ActionState>(defaultState);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentActionName, setCurrentActionName] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const pendingApiCall = useRef<(() => Promise<ApiResponse>) | null>(null);

  // Expose a global refresh trigger
  const triggerRefresh = () => {
    window.dispatchEvent(new Event('Local AI:refresh'));
  };

  const startPreflight = async (actionId: string, actionLabel: string, apiCall: () => Promise<ApiResponse>) => {
    setDrawerOpen(true);
    setCurrentActionName(actionLabel);
    setStartTime(Date.now());
    setActionState({ ...defaultState, isPreflight: true });
    pendingApiCall.current = apiCall;

    const res = await api.getPreflightCheck(actionId);
    if (res.ok && res.data) {
      const data = res.data as any;
      if (data.allowedToRun) {
        setActionState({ ...defaultState, isPreflightPassed: true, preflightData: data });
      } else {
        setActionState({ ...defaultState, isPreflightBlocked: true, preflightData: data });
      }
    } else {
      setActionState({ ...defaultState, isPreflightBlocked: true, error: res.error || "Preflight check failed." });
    }
  };

  const confirmLaunch = async () => {
    if (!pendingApiCall.current) return;
    const apiCall = pendingApiCall.current;
    pendingApiCall.current = null;
    
    setActionState({ ...defaultState, isRunning: true });
    setStartTime(Date.now());
    
    const res = await apiCall();
    handleExecutionResult(res);
  };

  const cancelLaunch = () => {
    pendingApiCall.current = null;
    setDrawerOpen(false);
    setActionState(defaultState);
  };

  const execute = async (name: string, apiCall: () => Promise<ApiResponse>) => {
    setDrawerOpen(true);
    setCurrentActionName(name);
    setStartTime(Date.now());
    setActionState({ ...defaultState, isRunning: true });

    const res = await apiCall();
    handleExecutionResult(res);
  };

  const handleExecutionResult = (res: ApiResponse) => {

    if (res.ok) {
      if (res.data?.status === 'running' && res.data?.runId) {
        // Polling loop
        pollRunStatus(res.data.runId);
      } else {
        // Sync response
        setActionState({ ...defaultState, isIdle: false, isSuccess: true, result: res.data, runRecord: res.data });
        triggerRefresh();
      }
    } else {
      setActionState({ ...defaultState, isIdle: false, isError: true, result: res.data, error: res.error });
    }
  };

  const pollRunStatus = async (runId: string) => {
    const check = async () => {
      const { api } = await import('../services/api');
      const res = await api.getRun(runId);
      if (res.ok && res.data) {
        const data = res.data as any;
        if (data.status === 'running') {
          setActionState(prev => ({ ...prev, runRecord: data }));
          setTimeout(check, 2000); // Check every 2 seconds
        } else {
          // Finished
          const data = res.data as any;
          const isSuccess = data.status === 'success';
          setActionState({ 
            ...defaultState,
            isIdle: false, 
            isSuccess, 
            isError: !isSuccess, 
            result: data, 
            error: data.error || null,
            runRecord: data 
          });
          triggerRefresh();
        }
      } else {
        setTimeout(check, 2000);
      }
    };
    check();
  };

  const openRun = async (runId: string) => {
    setDrawerOpen(true);
    setActionState({ ...defaultState, isIdle: false, isRunning: true });
    const { api } = await import('../services/api');
    const res = await api.getRun(runId);
    if (res.ok && res.data) {
      const data = res.data as any;
      setCurrentActionName(data.actionLabel);
      setStartTime(new Date(data.startedAt).getTime());
      setActionState({ 
        ...defaultState,
        isIdle: false, 
        isRunning: data.status === 'running', 
        isSuccess: data.status === 'success', 
        isError: ['error', 'timeout'].includes(data.status), 
        result: data, 
        error: null,
        runRecord: data 
      });
      if (data.status === 'running') {
        pollRunStatus(runId);
      }
    }
  };

  const closeDrawer = () => setDrawerOpen(false);

  return {
    actionState,
    drawerOpen,
    currentActionName,
    startTime,
    startPreflight,
    confirmLaunch,
    cancelLaunch,
    execute,
    openRun,
    closeDrawer
  };
}

