"use client";

import React, { useState } from "react";
import { useSentinelStore } from "../store/store";
import { 
  Heart, 
  Activity, 
  Shield, 
  Users, 
  Bell, 
  CloudOff, 
  Cloud, 
  LogOut, 
  Menu,
  X,
  FileText,
  Sun,
  Moon
} from "lucide-react";

interface LayoutShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function LayoutShell({ children, title, subtitle }: LayoutShellProps) {
  const { 
    currentRole, 
    currentUser, 
    isOffline, 
    toggleOfflineMode, 
    offlineQueue,
    notifications, 
    dismissNotification, 
    setRole,
    theme,
    toggleTheme
  } = useSentinelStore();
  
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const getRoleIcon = () => {
    switch (currentRole) {
      case "patient": return <Heart className="w-5 h-5 text-emerald-500" />;
      case "doctor": return <Activity className="w-5 h-5 text-indigo-500" />;
      case "hospital_admin": return <Shield className="w-5 h-5 text-sky-500" />;
      case "government_admin": return <Users className="w-5 h-5 text-amber-500" />;
      default: return <Heart className="w-5 h-5" />;
    }
  };

  const getRoleLabel = () => {
    switch (currentRole) {
      case "patient": return "Patient Twin";
      case "doctor": return "Doctor Mission Control";
      case "hospital_admin": return "Hospital Ops Command";
      case "government_admin": return "Government Intel";
      default: return "Sentinel OS";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative transition-colors duration-300">
      
      {/* Background Neon Blooms */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-950/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-950/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-border py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-emerald-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-950/50">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-500 to-indigo-500 bg-clip-text text-transparent">SENTINEL</span>
              <span className="text-xs bg-indigo-950 text-indigo-400 border border-indigo-900/60 px-2 py-0.5 rounded-full font-mono font-bold">HEALTH OS</span>
            </div>
            <p className="text-xs text-gray-500 hidden md:block">Predictive Healthcare System</p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-4">
          
          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-900/40 border border-border hover:bg-gray-800/60 transition text-gray-300 flex items-center gap-1.5 text-xs font-mono"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-amber-300">LIGHT</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline text-indigo-400">DARK</span>
              </>
            )}
          </button>

          {/* Offline Mode Trigger */}
          <button 
            onClick={toggleOfflineMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-300 ${
              isOffline 
                ? "bg-rose-950/40 border-rose-500/50 text-rose-400 shadow-neon-pulse animate-pulse" 
                : "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
            }`}
            title={isOffline ? "Click to connect back online" : "Click to test local offline engine"}
          >
            {isOffline ? (
              <>
                <CloudOff className="w-4 h-4 text-rose-400" />
                <span>OFFLINE MODE ({offlineQueue.length})</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>CLOUD CONNECTED</span>
              </>
            )}
          </button>

          {/* Role Status Tag */}
          <div className="hidden lg:flex items-center gap-2 bg-gray-900/60 border border-border px-3 py-1.5 rounded-lg text-xs font-medium">
            {getRoleIcon()}
            <span className="text-gray-300">{getRoleLabel()}</span>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 rounded-lg bg-gray-900/50 border border-border hover:bg-gray-800/80 transition relative"
            >
              <Bell className="w-4 h-4 text-gray-300" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-3 w-80 glass-panel p-4 rounded-xl shadow-glass-glow z-50 animate-slide-up border border-white/10">
                <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                  <h4 className="text-xs font-bold font-mono text-gray-400">CRITICAL OS ALERTS</h4>
                  <button onClick={() => setShowNotifMenu(false)} className="text-gray-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No active critical alarms. System healthy.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-3 rounded-lg border text-xs relative ${
                          n.type === "critical" 
                            ? "bg-rose-950/30 border-rose-900/60 text-rose-300" 
                            : n.type === "warning"
                            ? "bg-amber-950/20 border-amber-900/50 text-amber-300"
                            : "bg-indigo-950/30 border-indigo-900/60 text-indigo-300"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1 font-bold">
                          <span>{n.title}</span>
                          <button 
                            onClick={() => dismissNotification(n.id)}
                            className="text-gray-500 hover:text-white ml-2 text-xs"
                          >
                            Dismiss
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed">{n.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile / Exit Switcher */}
          <div className="flex items-center gap-3 border-l border-border pl-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-gray-200">{currentUser?.fullName || "Guest Account"}</p>
              <p className="text-[10px] text-gray-500 font-mono">{currentUser?.username || "authenticated"}</p>
            </div>
            <button 
              onClick={() => setRole("guest")}
              className="p-2 rounded-lg bg-gray-900/50 border border-border hover:bg-rose-950/30 hover:border-rose-900/50 hover:text-rose-400 transition"
              title="Return to Launcher Switcher"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Core Body */}
      <main className="flex-1 flex flex-col p-6 max-w-[1600px] w-full mx-auto animate-scale-in">
        
        {/* Title row */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>

          {/* Operational Status Tag */}
          <div className="flex items-center gap-4 bg-gray-950/80 border border-border py-1.5 px-3 rounded-lg text-xs font-mono">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOffline ? "bg-rose-400" : "bg-emerald-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isOffline ? "bg-rose-500" : "bg-emerald-500"}`}></span>
            </span>
            <span className="text-gray-400">TELEMETRY SYNC: <strong className={isOffline ? "text-rose-400" : "text-emerald-400"}>{isOffline ? "LOCAL_LOCK" : "OPERATIONAL"}</strong></span>
          </div>
        </div>

        {children}
      </main>
      
      {/* OS Footer */}
      <footer className="py-4 px-6 border-t border-border bg-gray-950/20 text-center text-[10px] text-gray-600 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Sentinel Health Operating System. All Rights Reserved. ISO-27001 | HIPAA Certified.</p>
        <p>VECTOR_STORE: pgvector://localhost/sentinel_kb | AUDIT_SESSION: SECURE</p>
      </footer>
    </div>
  );
}
