export type AppStatus = "online" | "offline" | "initializing";
export type ServiceStatus = "healthy" | "degraded" | "offline";
export type MissionConfidence = "high" | "medium" | "low" | "unknown";
export type AutomationReadiness = "ready" | "partial" | "blocked" | "unknown";

export interface DashboardStatus {
  label: string;
  tone: "success" | "warning" | "danger" | "info";
  confidence: MissionConfidence;
  message: string;
  automationReadiness: AutomationReadiness;
  score: number;
}

export function deriveDashboardStatus(health: any, loading: boolean): DashboardStatus {
  if (loading) {
    return {
      label: "INITIALIZING",
      tone: "info",
      confidence: "unknown",
      message: "Establishing connection to local core...",
      automationReadiness: "unknown",
      score: 0
    };
  }

  if (!health || health.backendOnline === false) {
    return {
      label: "BACKEND OFFLINE",
      tone: "danger",
      confidence: "low",
      message: "Backend unreachable. Run 'npm run server'.",
      automationReadiness: "blocked",
      score: 0
    };
  }

  // Check critical folder mounts and base scripts
  const scriptsOk = health.scriptsExist && 
    health.scriptsExist.routineReminder && 
    health.scriptsExist.dynamicAdjustment;

  if (health.dropFolderExists && health.processedFolderExists && scriptsOk) {
    if (!health.openclawGatewayReachable) {
      return {
        label: "DEGRADED",
        tone: "warning",
        confidence: "medium",
        message: "Dashboard online. OpenClaw gateway offline.",
        automationReadiness: "partial",
        score: 75 // 65-80 range for static reminders working
      };
    }

    return {
      label: "ONLINE",
      tone: "success",
      confidence: "high",
      message: "Command center fully operational.",
      automationReadiness: "ready",
      score: 95 // 85-95 range
    };
  }

  return {
    label: "ACTION NEEDED",
    tone: "warning",
    confidence: "medium",
    message: "Some local paths or scripts need attention.",
    automationReadiness: "partial",
    score: 55 // 40-60 range
  };
}
