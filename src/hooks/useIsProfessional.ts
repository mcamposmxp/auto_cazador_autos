import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsProfessional() {
  const [isProfessional, setIsProfessional] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsProfessional(false);
        setLoading(false);
        return;
      }

      // Prefer profiles to determine the user type
      const { data } = await supabase
        .from("profiles")
        .select("tipo_usuario")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setIsProfessional((data?.tipo_usuario || "").toLowerCase() === "profesional");
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => check(), 0);
    });

    check();
    return () => subscription.unsubscribe();
  }, []);

  return { isProfessional, loading };
}
