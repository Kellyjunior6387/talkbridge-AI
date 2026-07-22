"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  AlertCircle, 
  MessageSquare, 
  Package, 
  BarChart2, 
  Settings,
  Share2,
  X,
  CheckCircle,
  Info,
  LogOut
} from "lucide-react";
import { supabase } from "../../lib/supabase";

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

  // Track pending urgent notifications count
  const urgentCount = 3;

  useEffect(() => {
    let mounted = true;

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setUserEmail(session.user.email || "");
        const meta = session.user.user_metadata || {};
        setBusinessName(meta.business_name || meta.full_name || "Threads Kenya");
        const name = meta.full_name || "Threads Kenya";
        setUserInitials(name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2));
      } else {
        router.push("/auth");
      }
      setLoadingSession(false);
    });

    // Subscribe to auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) {
        setUserEmail(session.user.email || "");
        const meta = session.user.user_metadata || {};
        setBusinessName(meta.business_name || meta.full_name || "Threads Kenya");
        const name = meta.full_name || "Threads Kenya";
        setUserInitials(name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2));
      } else {
        router.push("/auth");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

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

  // Nav definitions
  const navItems = [
    {
      name: "Urgent",
      path: "/dashboard/urgent",
      icon: AlertCircle,
      badge: urgentCount,
      badgeColor: "bg-[#FF6B6B]"
    },
    {
      name: "Message Log",
      path: "/dashboard/messages",
      icon: MessageSquare,
      badge: 0
    },
    {
      name: "Products",
      path: "/dashboard/products",
      icon: Package,
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
      <div className="min-h-screen bg-[#080B14] flex items-center justify-center text-sm font-mono text-[#7A8BAD]">
        Verifying secure workspace session...
      </div>
    );
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div className="min-h-screen bg-[#080B14] text-[#F0F4FF] font-body flex overflow-hidden">
        
        {/* DESKTOP SIDEBAR (240px) */}
        <aside className="hidden md:flex flex-col justify-between w-60 bg-[#0F1624] border-r border-[#1C2640] shrink-0 h-screen sticky top-0">
          
          {/* Top Logo */}
          <div className="p-6 border-b border-[#1C2640]/60">
            <Link href="/" className="flex items-center gap-2 group">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4DFFC3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 17c4-5 16-5 20 0" />
                <path d="M2 12h20" strokeDasharray="1 1" className="opacity-60" />
                <path d="M2 12c3-1 17-1 20 0" />
                <path d="M6 12v2" />
                <path d="M12 11v4" />
                <path d="M18 12v2" />
              </svg>
              <span className="font-display font-bold text-lg text-white">
                TalkBridge<span className="text-[#4DFFC3]">AI</span>
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
                      ? "bg-[#162033] border-[#4DFFC3] text-white"
                      : "border-transparent text-[#7A8BAD] hover:bg-[#162033] hover:text-[#F0F4FF]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      size={18} 
                      className={`shrink-0 transition-colors ${
                        isActive ? "text-[#4DFFC3]" : "text-[#7A8BAD] group-hover:text-[#4DFFC3]"
                      }`} 
                    />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  
                  {item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-[#080B14] ${item.badgeColor || "bg-[#4DFFC3]"}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User profile section */}
          <div className="p-4 border-t border-[#1C2640] flex items-center justify-between bg-[#080B14]/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#7B6EF6] text-white flex items-center justify-center font-bold text-sm shrink-0 border border-[#1C2640]">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#F0F4FF] truncate">{businessName}</p>
                <p className="text-[10px] text-[#7A8BAD] truncate font-mono">{userEmail}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-[#7A8BAD] hover:text-[#FF6B6B] rounded transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* MOBILE BOTTOM TAB BAR (Sticky at bottom on small screens) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0F1624] border-t border-[#1C2640] z-40 flex items-center justify-around px-2 shadow-2xl">
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
                    isActive ? "text-[#4DFFC3]" : "text-[#7A8BAD]"
                  }`} 
                />
                <span className={`text-[9px] font-medium mt-1 transition-colors ${
                  isActive ? "text-white" : "text-[#7A8BAD]"
                }`}>
                  {item.name.split(" ")[0]}
                </span>
                
                {item.badge > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 bg-[#FF6B6B] text-[8px] font-mono font-bold text-[#080B14] rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* MAIN VIEW AREA */}
        <main className="flex-grow overflow-y-auto pb-20 md:pb-0 h-screen relative bg-[#080B14]">
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
                className={`pointer-events-auto w-[320px] bg-[#162033] border-l-4 rounded-r-lg p-4 shadow-xl flex items-start gap-3 justify-between animate-slideIn ${
                  isSuccess ? "border-[#4DFFC3]" : isError ? "border-[#FF6B6B]" : "border-[#7B6EF6]"
                }`}
              >
                <div className="flex gap-2">
                  <div className="mt-0.5 shrink-0">
                    {isSuccess && <CheckCircle size={16} className="text-[#4DFFC3]" />}
                    {isError && <X size={16} className="text-[#FF6B6B]" />}
                    {isInfo && <Info size={16} className="text-[#7B6EF6]" />}
                  </div>
                  <p className="text-xs text-[#F0F4FF] font-medium leading-relaxed">{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-[#7A8BAD] hover:text-[#F0F4FF] transition-colors"
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
