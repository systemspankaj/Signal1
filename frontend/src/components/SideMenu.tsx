"use client";

import { useEffect, useState } from "react";
import {
  X,
  LogOut,
  Sun,
  Moon,
  Settings,
  User,
  Shield,
  Bell,
  Smartphone,
  ChevronRight,
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import Avatar from "./Avatar";

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  onNewGroup: () => void;
}

type MenuView = "main" | "settings";

export default function SideMenu({ open, onClose, onNewGroup }: SideMenuProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [view, setView] = useState<MenuView>("main");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setView("main");
    }
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const handleNewGroup = () => {
    handleClose();
    setTimeout(onNewGroup, 300);
  };

  const mainItems = [
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      desc: "Privacy, notifications, appearance",
      action: () => setView("settings"),
    },
    {
      id: "group",
      icon: UserPlus,
      label: "New group",
      desc: "Create a group conversation",
      action: handleNewGroup,
    },
    {
      id: "account",
      icon: User,
      label: "Account",
      desc: "Security, change number",
      soon: true,
    },
    {
      id: "privacy",
      icon: Shield,
      label: "Privacy",
      desc: "Block contacts, disappearing messages",
      soon: true,
    },
    {
      id: "notifications",
      icon: Bell,
      label: "Notifications",
      desc: "Message and call tones",
      soon: true,
    },
    {
      id: "devices",
      icon: Smartphone,
      label: "Linked devices",
      desc: "Coming soon",
      soon: true,
    },
  ];

  if (!open && !visible) return null;

  return (
    <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Sliding panel */}
      <div
        className={`absolute top-0 left-0 h-full w-[320px] max-w-[85vw] bg-sidebar border-r border-signal shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {view === "main" ? (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-signal">
              <h2 className="text-lg font-semibold text-primary">Menu</h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {user && (
              <div className="flex items-center gap-3 px-5 py-4 border-b border-signal">
                <Avatar user={user} size="md" />
                <div className="min-w-0">
                  <p className="font-medium text-primary truncate">{user.display_name}</p>
                  <p className="text-sm text-secondary truncate">{user.phone || user.username}</p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {mainItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    disabled={item.soon}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-hover transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-9 h-9 rounded-lg bg-input flex items-center justify-center flex-shrink-0">
                      <Icon className="h-[18px] w-[18px] text-secondary" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] text-primary">{item.label}</p>
                      <p className="text-xs text-secondary truncate">{item.desc}</p>
                    </div>
                    {!item.soon && item.id === "settings" && (
                      <ChevronRight className="h-4 w-4 text-secondary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={async () => {
                await logout();
                handleClose();
              }}
              className="flex items-center gap-3 px-5 py-4 text-red-500 hover:bg-hover border-t border-signal"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Log out</span>
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 py-4 border-b border-signal">
              <button
                onClick={() => setView("main")}
                className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-primary flex-1">Settings</h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {user && (
              <div className="flex items-center gap-3 px-5 py-4 border-b border-signal">
                <Avatar user={user} size="md" />
                <div>
                  <p className="font-medium text-primary">{user.display_name}</p>
                  <p className="text-sm text-secondary">{user.phone || user.username}</p>
                </div>
              </div>
            )}

            <div className="px-5 py-4 border-b border-signal">
              <p className="text-sm font-medium text-primary mb-3">Appearance</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-colors ${
                    theme === "light"
                      ? "border-signal-blue bg-signal-blue/10 text-signal-blue"
                      : "border-signal text-secondary hover:bg-hover"
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-colors ${
                    theme === "dark"
                      ? "border-signal-blue bg-signal-blue/10 text-signal-blue"
                      : "border-signal text-secondary hover:bg-hover"
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {[
                { title: "Account", desc: "Security notifications, change number" },
                { title: "Privacy", desc: "Block contacts, disappearing messages" },
                { title: "Chats", desc: "Theme, wallpaper, chat history" },
                { title: "Notifications", desc: "Message, group & call tones" },
                { title: "Linked Devices", desc: "Coming Soon" },
              ].map((item) => (
                <button
                  key={item.title}
                  className="w-full text-left px-5 py-3.5 hover:bg-hover border-b border-signal"
                >
                  <p className="text-primary text-[15px]">{item.title}</p>
                  <p className="text-xs text-secondary">{item.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
