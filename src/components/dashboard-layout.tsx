"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Settings, 
  LogOut,
  ChevronRight,
  Loader2,
  Package,
  Zap,
  Sun,
  Moon,
  CalendarClock,
  ShieldCheck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser, useAuth, useDoc, useFirestore } from "@/firebase";
import { signOut } from "firebase/auth";
import { useState, useEffect, useMemo } from "react";
import { doc } from "firebase/firestore";
import { UserProfile } from "@/lib/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "admin" | "client";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const userRef = useMemo(() => (user ? doc(db, "users", user.uid) : null), [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const menuItems = useMemo(() => {
    if (role === "client") {
      return [
        { title: "Visão Geral", icon: LayoutDashboard, href: "/dashboard/client" },
        { title: "Ativações", icon: Zap, href: "/dashboard/client/activations" },
        { title: "Documentos", icon: ClipboardList, href: "/dashboard/client/docs" },
        { title: "Suporte RTM", icon: Settings, href: "/dashboard/client/support" },
      ];
    }

    const items = [
      { title: "Visão Geral", icon: LayoutDashboard, href: "/dashboard/admin" },
      { title: "Produtos & Fluxos", icon: Package, href: "/dashboard/admin/products" },
      { title: "Gestão Onboarding", icon: ClipboardList, href: "/dashboard/admin/onboarding" },
      { title: "Clientes", icon: Users, href: "/dashboard/admin/clients" },
    ];

    if (profile?.adminType === 'suporte' || profile?.adminType === 'coordenador_suporte') {
      items.push({ title: "Sobreaviso", icon: CalendarClock, href: "/dashboard/admin/oncall" });
    }
    
    return items;
  }, [role, profile?.adminType]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background transition-colors duration-300">
        <Sidebar className="border-r border-border bg-card">
          <SidebarHeader className="p-6">
            <Link href="/" className="flex items-center gap-2 font-headline font-bold text-2xl text-primary hover:opacity-80 transition-opacity">
              OnFlow
            </Link>
          </SidebarHeader>
          <SidebarContent className="px-3">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href || (item.href !== "/dashboard/admin" && item.href !== "/dashboard/client" && pathname.startsWith(item.href + '/'))}
                    className={cn(
                      "py-6 px-4 rounded-xl transition-all hover:bg-primary/5 hover:text-primary",
                      (pathname === item.href || (item.href !== "/dashboard/admin" && item.href !== "/dashboard/client" && pathname.startsWith(item.href + '/'))) && "bg-primary/5 text-primary font-semibold"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span>{item.title}</span>
                      {(pathname === item.href || (item.href !== "/dashboard/admin" && item.href !== "/dashboard/client" && pathname.startsWith(item.href + '/'))) && <ChevronRight className="ml-auto size-4" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-xl mb-4 group cursor-default transition-colors hover:bg-muted">
              <Avatar className="size-10 border-2 border-primary/20 transition-transform group-hover:scale-105">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid || role}/100/100`} />
                <AvatarFallback className="bg-primary text-primary-foreground">{user?.email?.charAt(0).toUpperCase() || (role === 'admin' ? 'AD' : 'CL')}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold truncate text-foreground">{user?.displayName || (role === 'admin' ? 'Admin' : 'Cliente')}</span>
                  {profile?.adminType === 'coordenador_suporte' && <ShieldCheck className="size-3 text-primary" title="Coordenador Master" />}
                </div>
                <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
              </div>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-xl py-5 transition-colors"
                >
                  <LogOut className="size-5" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-background">
          <header className="flex h-16 items-center border-b px-6 bg-card sticky top-0 z-50 shadow-sm transition-colors">
            <SidebarTrigger className="-ml-1 mr-4 text-foreground hover:bg-muted hover:text-primary rounded-lg transition-colors" />
            <div className="flex-1">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                OnFlow RTM / {pathname.split('/').pop()?.replace('-', ' ')}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                title={isDarkMode ? "Mudar para Tema Claro" : "Mudar para Tema Escuro"}
              >
                {isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}