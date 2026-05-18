
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
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  Loader2,
  Package,
  Zap
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "admin" | "client";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const menuItems = role === "admin" 
    ? [
        { title: "Visão Geral", icon: LayoutDashboard, href: "/dashboard/admin" },
        { title: "Produtos & Fluxos", icon: Package, href: "/dashboard/admin/products" },
        { title: "Gestão Onboarding", icon: ClipboardList, href: "/dashboard/admin/onboarding" },
        { title: "Clientes", icon: Users, href: "/dashboard/admin/clients" },
        { title: "Relatórios", icon: BarChart3, href: "/dashboard/admin/reports" },
      ]
    : [
        { title: "Visão Geral", icon: LayoutDashboard, href: "/dashboard/client" },
        { title: "Ativações", icon: Zap, href: "/dashboard/client/activations" },
        { title: "Documentos", icon: ClipboardList, href: "/dashboard/client/docs" },
        { title: "Suporte RTM", icon: Settings, href: "/dashboard/client/support" },
      ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="p-6">
            <Link href="/" className="flex items-center gap-2 font-headline font-bold text-2xl text-primary">
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
                      "py-6 px-4 rounded-xl transition-all",
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
            <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-xl mb-4">
              <Avatar className="size-10 border-2 border-primary/20">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid || role}/100/100`} />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || (role === 'admin' ? 'AD' : 'CL')}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate">{user?.displayName || (role === 'admin' ? 'Admin' : 'Cliente')}</span>
                <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
              </div>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="size-5" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 items-center border-b px-6 bg-white/50 backdrop-blur-md sticky top-0 z-10">
            <SidebarTrigger className="-ml-1 mr-4" />
            <div className="flex-1">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                OnFlow RTM / {pathname.split('/').pop()?.replace('-', ' ')}
              </h2>
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
