// src/components/OwnerGuard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function OwnerGuard({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<null | boolean>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setOk(false);
      const { data, error } = await supabase.rpc('is_system_owner');
      setOk(!error && !!data);
    })();
  }, []);

  if (ok === null) return <div className="p-6">Verificando permissão…</div>;
  if (!ok) return <div className="p-6 text-red-600">Acesso negado (apenas dono do sistema).</div>;
  return <>{children}</>;
}
