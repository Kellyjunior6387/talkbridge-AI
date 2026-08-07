"use client";

import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MessageSquare,
  Package,
  TrendingUp,
  Video,
  Share2,
  BarChart2,
  Settings,
  LogOut,
  CheckCircle,
  X,
  Info
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { API_BASE_URL } from "../../lib/api";

// Toast System Types
export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider in DashboardLayout");
  }
  return context;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Auth User Details
  const [userEmail, setUserEmail] = useState("jane@threads.co.ke");
  const [businessName, setBusinessName] = useState("Threads Kenya");
  const [userInitials, setUserInitials] = useState("TK");
  const [loadingSession, setLoadingSession] = useState(true);

  const [urgentCount, setUrgentCount] = useState(0);

  const fetchUrgentCount = useCallback(async (userId: string | null) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/test/messages?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const count = data.filter((m: { status?: string }) => m.status === "pending" || m.status === "escalated").length;
        setUrgentCount(count);
      }
    } catch (err) {
      console.error("Failed to load urgent count in layout:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let currentUserId: string | null = null;

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        currentUserId = session.user.id;
        setUserEmail(session.user.email || "");
        const meta = session.user.user_metadata || {};
        setBusinessName(meta.business_name || meta.full_name || "Threads Kenya");
        const name = meta.full_name || "Threads Kenya";
        setUserInitials(name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2));
        fetchUrgentCount(currentUserId);
      } else {
        router.push("/auth");
      }
      setLoadingSession(false);
    });

    const interval = setInterval(() => {
      if (currentUserId) {
        fetchUrgentCount(currentUserId);
      }
    }, 10000);

    // Subscribe to auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) {
        currentUserId = session.user.id;
        setUserEmail(session.user.email || "");
        const meta = session.user.user_metadata || {};
        setBusinessName(meta.business_name || meta.full_name || "Threads Kenya");
        const name = meta.full_name || "Threads Kenya";
        setUserInitials(name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2));
        fetchUrgentCount(currentUserId);
      } else {
        currentUserId = null;
        router.push("/auth");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [router, fetchUrgentCount]);

  const showToast = (message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto-remove toast after 4s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast("Logged out successfully", "info");
    router.push("/");
  };

  // Navigation Items Order (1. Messages, 2. Products, 3. Publish, 4. Integrate, 5. Usage, 6. Settings)
  const navItems = [
    {
      name: "Messages",
      path: "/dashboard/messages",
      icon: MessageSquare,
      badge: urgentCount,
      badgeColor: "bg-[#FF6B6B]"
    },
    {
      name: "Products",
      path: "/dashboard/products",
      icon: Package,
      badge: 0
    },
    {
      name: "Insights",
      path: "/dashboard/insights",
      icon: TrendingUp,
      badge: 0
    },
    {
      name: "Publish",
      path: "/dashboard/publish",
      icon: Video,
      badge: 0
    },
    {
      name: "Integrate",
      path: "/dashboard/integrate",
      icon: Share2,
      badge: 0
    },
    {
      name: "Usage",
      path: "/dashboard/usage",
      icon: BarChart2,
      badge: 0
    },
    {
      name: "Settings",
      path: "/dashboard/settings",
      icon: Settings,
      badge: 0
    }
  ];

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-mono text-slate-500">
        Verifying secure workspace session...
      </div>
    );
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div className="min-h-screen bg-slate-50 text-slate-800 font-body flex overflow-hidden">
        
        {/* DESKTOP SIDEBAR (240px) */}
        <aside className="hidden md:flex flex-col justify-between w-60 bg-white border-r border-slate-200 shrink-0 h-screen sticky top-0">
          
          {/* Top Logo */}
          <div className="p-6 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-2 group">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 17c4-5 16-5 20 0" />
                <path d="M2 12h20" strokeDasharray="1 1" className="opacity-45" stroke="#3B82F6" />
                <path d="M2 12c3-1 17-1 20 0" />
                <path d="M6 12v2" />
                <path d="M12 11v4" />
                <path d="M18 12v2" />
              </svg>
              <span className="font-display font-bold text-lg text-slate-900">
                TalkBridge<span className="text-[#3B82F6]">AI</span>
              </span>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-grow py-6 px-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all duration-150 group border-l-2 ${
                    isActive
                      ? "bg-blue-50/70 border-blue-600 text-blue-600 font-semibold"
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      size={18} 
                      className={`shrink-0 transition-colors ${
                        isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
                      }`} 
                    />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  
                  {item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-white ${item.badgeColor || "bg-[#3B82F6]"}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User profile section */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200 shadow-sm">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{businessName}</p>
                <p className="text-[10px] text-slate-500 truncate font-mono">{userEmail}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* MOBILE BOTTOM TAB BAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-40 flex items-center justify-around px-2 shadow-2xl">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className="relative flex flex-col items-center justify-center w-14 h-14 rounded-lg focus:outline-none"
              >
                <Icon 
                  size={20} 
                  className={`transition-colors ${
                    isActive ? "text-blue-600" : "text-slate-455"
                  }`} 
                />
                <span className={`text-[9px] font-medium mt-1 transition-colors ${
                  isActive ? "text-blue-600 font-semibold" : "text-slate-500"
                }`}>
                  {item.name.split(" ")[0]}
                </span>
                
                {item.badge > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 bg-[#FF6B6B] text-[8px] font-mono font-bold text-white rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* MAIN VIEW AREA */}
        <main className="flex-grow overflow-y-auto pb-20 md:pb-0 h-screen relative bg-slate-50">
          {children}
        </main>

        {/* TOAST CONTAINER */}
        <div className="fixed top-4 right-4 z-50 pointer-events-none space-y-2">
          {toasts.map((toast) => {
            const isSuccess = toast.type === "success";
            const isError = toast.type === "error";
            const isInfo = toast.type === "info";
            
            return (
              <div
                key={toast.id}
                className={`pointer-events-auto w-[320px] bg-white border-l-4 rounded-r-lg p-4 shadow-xl flex items-start gap-3 justify-between border-slate-200 animate-slideIn ${
                  isSuccess ? "border-blue-600" : isError ? "border-red-500" : "border-indigo-600"
                }`}
              >
                <div className="flex gap-2">
                  <div className="mt-0.5 shrink-0">
                    {isSuccess && <CheckCircle size={16} className="text-blue-600" />}
                    {isError && <X size={16} className="text-red-500" />}
                    {isInfo && <Info size={16} className="text-indigo-600" />}
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </ToastContext.Provider>
  );
}
