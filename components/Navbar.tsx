"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, Home, Compass, BrainCircuit } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    apiClient.clearToken();
    logout();
    router.push("/login");
  };

  if (!user) return null;

  const isDashboard = pathname === "/dashboard";
  const isDiscover = pathname === "/discover";

  return (
    <nav className="sticky top-0 z-50 border-b border-white/20 bg-[linear-gradient(120deg,rgba(9,14,35,0.96),rgba(18,33,66,0.96))] text-white backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-300 to-blue-500 text-[#061229]">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Research+</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={
                  isDashboard
                    ? "bg-white/20 text-white hover:bg-white/25"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/discover">
              <Button
                variant="ghost"
                size="sm"
                className={
                  isDiscover
                    ? "bg-white/20 text-white hover:bg-white/25"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }
              >
                <Compass className="w-4 h-4 mr-2" />
                Discover
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  {user.firstName || user.email.split("@")[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled
                  className="text-xs text-muted-foreground"
                >
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
