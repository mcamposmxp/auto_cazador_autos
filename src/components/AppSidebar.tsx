import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Car,
  Search,
  ShoppingCart,
  Shield,
  BarChart3,
  Settings,
  CreditCard,
  Bell,
  Home,
  ChevronDown,
  Gift,
  DollarSign,
  HelpCircle,
  HandCoins,
  User
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  
  useSidebar,
} from "@/components/ui/sidebar";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsProfessional } from "@/hooks/useIsProfessional";

const navigationItems = [
  {
    title: "Inicio",
    url: "/",
    icon: Home,
  },
  {
    title: "Precios de Mercado",
    url: "/valuacion",
    icon: Car,
  },
  {
    title: "Precios de Venta",
    url: "/precios-venta",
    icon: DollarSign,
  },
  {
    title: "Comprar Auto",
    icon: Search,
    items: [
      { title: "Ver Anuncios", url: "/comprar" }
    ]
  },
  {
    title: "Vender Auto",
    icon: ShoppingCart,
    items: [
      { title: "Vender mi Auto", url: "/opciones-venta" },
      { title: "Ver ofertas", url: "/panel-ofertas" },
    ]
  },
  {
    title: "Ayuda a comprar Auto",
    url: "/ayuda-comprar",
    icon: HelpCircle,
  },
  {
    title: "Servicio Trust",
    url: "/trust",
    icon: Shield,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
];

const accountItems = [
  {
    title: "Mis Datos",
    url: "/mis-datos",
    icon: User,
  },
  {
    title: "Notificaciones",
    url: "/notificaciones",
    icon: Bell,
    badge: "3"
  },
  {
    title: "Créditos Gratis",
    url: "/creditos-gratis", 
    icon: Gift,
    badge: "5"
  },
  {
    title: "Planes",
    url: "/planes", 
    icon: HandCoins,
  },
  {
    title: "Configuración",
    url: "/configuracion",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const collapsed = state === "collapsed";
  const { isProfessional } = useIsProfessional();
  const { isAdmin } = useIsAdmin();

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (items?: Array<{url: string}>) => 
    items?.some(item => location.pathname === item.url) || false;

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(g => g !== title)
        : [...prev, title]
    );
  };

  const getNavClasses = (isActive: boolean) => 
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Car className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">AutoPriceLabs</h2>
              <p className="text-xs text-muted-foreground">Pricing Intelligence</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible 
                      open={openGroups.includes(item.title) || isGroupActive(item.items)}
                      onOpenChange={() => toggleGroup(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          className={`w-full justify-between ${getNavClasses(isGroupActive(item.items))}`}
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </div>
                          {!collapsed && <ChevronDown className="h-4 w-4" />}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && (
                        <CollapsibleContent>
                          <div className="ml-6 mt-1 space-y-1">
                            {item.items.map((subItem) => (
                              <SidebarMenuButton key={subItem.url} asChild>
                                <NavLink 
                                  to={subItem.url}
                                  className={`text-sm ${getNavClasses(isActive(subItem.url))}`}
                                >
                                  {subItem.title}
                                </NavLink>
                              </SidebarMenuButton>
                            ))}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url!}
                        className={getNavClasses(isActive(item.url!))}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
              {/* Profesionales menu */}
              {isProfessional && (
                <SidebarMenuItem>
                  <Collapsible 
                    open={openGroups.includes("Profesionales") || 
                      (location.pathname === "/panel-profesionales" || location.pathname === "/oportunidades" || location.pathname === "/vender")}
                    onOpenChange={() => toggleGroup("Profesionales")}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton 
                        className={`w-full justify-between ${getNavClasses(
                          location.pathname === "/panel-profesionales" || location.pathname === "/oportunidades" || location.pathname === "/vender"
                        )}`}
                      >
                        <div className="flex items-center gap-2">
                          <HandCoins className="h-4 w-4" />
                          {!collapsed && <span>Profesionales</span>}
                        </div>
                        {!collapsed && <ChevronDown className="h-4 w-4" />}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {!collapsed && (
                      <CollapsibleContent>
                        <div className="ml-6 mt-1 space-y-1">
                          <SidebarMenuButton asChild>
                            <NavLink 
                              to="/panel-profesionales"
                              className={`text-sm ${getNavClasses(isActive('/panel-profesionales'))}`}
                            >
                              Oportunidades
                            </NavLink>
                          </SidebarMenuButton>
                          <SidebarMenuButton asChild>
                            <NavLink 
                              to="/vender"
                              className={`text-sm ${getNavClasses(isActive('/vender'))}`}
                            >
                              Mis Anuncios
                            </NavLink>
                          </SidebarMenuButton>
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                </SidebarMenuItem>
              )}
              {/* Admin link */}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/administracion"
                      className={getNavClasses(isActive('/administracion'))}
                    >
                      <Shield className="h-4 w-4" />
                      {!collapsed && <span>Administración</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={`${getNavClasses(isActive(item.url))} justify-between`}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </div>
                      {!collapsed && item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}