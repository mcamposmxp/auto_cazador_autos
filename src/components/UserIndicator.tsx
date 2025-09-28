import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsProfessional } from "@/hooks/useIsProfessional";
import { useAuthSession } from "@/hooks/useAuthSession";
import AuthModal from "@/components/AuthModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function UserIndicator() {
  const [openAuth, setOpenAuth] = useState(false);
  const { user } = useAuthSession();
  const { isAdmin } = useIsAdmin();
  const { isProfessional } = useIsProfessional();
  const navigate = useNavigate();
  
  const email = user?.email || null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate("/");
  };

  const handleSwitchUser = async () => {
    await supabase.auth.signOut();
    setOpenAuth(true);
  };

  if (!email) {
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => setOpenAuth(true)}>
          Iniciar sesión
        </Button>
        <AuthModal isOpen={openAuth} onClose={() => setOpenAuth(false)} onSuccess={() => setOpenAuth(false)} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <span className="truncate max-w-[160px]">{email}</span>
            {isProfessional && <Badge variant="secondary" className="ml-1">Pro</Badge>}
            {isAdmin && <Badge variant="default" className="ml-1">Admin</Badge>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Sesión</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isProfessional && (
            <DropdownMenuItem onClick={() => navigate("/panel-profesionales")}>Panel de Profesionales</DropdownMenuItem>
          )}
          {isAdmin && (
            <DropdownMenuItem onClick={() => navigate("/administracion")}>Administración</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSwitchUser}>Cambiar de usuario</DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AuthModal isOpen={openAuth} onClose={() => setOpenAuth(false)} onSuccess={() => setOpenAuth(false)} />
    </>
  );
}
