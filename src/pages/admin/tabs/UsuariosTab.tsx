import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  flag_count: number;
  account_status: string;
  pending_penalty_balance: number;
  role?: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "secondary",
  frozen: "default",
  suspended: "destructive",
};

export function UsuariosTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "frozen" | "suspended" | "providers" | "clients">("all");
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: usersData } = await supabase
      .from("users")
      .select("id, full_name, email, flag_count, account_status, pending_penalty_balance")
      .order("flag_count", { ascending: false });

    if (!usersData?.length) { setUsers([]); setLoading(false); return; }

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", usersData.map(u => u.id));

    const roleMap: Record<string, string> = {};
    rolesData?.forEach(r => { roleMap[r.user_id] = r.role; });

    setUsers(usersData.map(u => ({
      ...u,
      flag_count: u.flag_count ?? 0,
      account_status: u.account_status ?? "active",
      pending_penalty_balance: u.pending_penalty_balance ?? 0,
      role: roleMap[u.id] || "client",
    })));
    setLoading(false);
  };

  const updateUser = async (userId: string, patch: Partial<UserRow>) => {
    setActing(userId);
    try {
      await supabase.from("users").update(patch as any).eq("id", userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...patch } : u));
      toast.success("Usuario actualizado");
    } catch { toast.error("Error al actualizar"); }
    finally { setActing(null); }
  };

  const addFlag = async (user: UserRow) => {
    const newCount = user.flag_count + 1;
    const newStatus = newCount >= 6 ? "suspended" : newCount >= 3 ? "frozen" : user.account_status;
    await updateUser(user.id, { flag_count: newCount, account_status: newStatus });
    await (supabase as any).from("account_flags").insert({
      user_id: user.id, reason: "Advertencia manual del administrador", flagged_by: "admin",
    });
  };

  const removeFlag = async (user: UserRow) => {
    const newCount = Math.max(0, user.flag_count - 1);
    const newStatus = newCount < 3 ? "active" : newCount < 6 ? "frozen" : "suspended";
    updateUser(user.id, { flag_count: newCount, account_status: newStatus });
  };

  const filtered = users.filter(u => {
    if (filter === "frozen") return u.account_status === "frozen";
    if (filter === "suspended") return u.account_status === "suspended";
    if (filter === "providers") return u.role === "provider" || u.role === "admin";
    if (filter === "clients") return u.role === "client";
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="frozen">Solo congelados</SelectItem>
            <SelectItem value="suspended">Solo suspendidos</SelectItem>
            <SelectItem value="providers">Solo proveedores</SelectItem>
            <SelectItem value="clients">Solo clientes</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchData}>Actualizar</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Nombre", "Email", "Rol", "Flags", "Estado", "Penalización pendiente", "Acciones"].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Sin usuarios</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{u.full_name || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{u.email || "—"}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="text-xs capitalize">{u.role}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <span className={u.flag_count >= 3 ? "font-semibold text-destructive" : ""}>{u.flag_count}</span>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={STATUS_VARIANT[u.account_status] ?? "secondary"}>
                      {u.account_status === "active" ? "Activo" : u.account_status === "frozen" ? "Congelado" : "Suspendido"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    {u.pending_penalty_balance > 0
                      ? <span className="text-destructive font-medium">${(u.pending_penalty_balance / 100).toFixed(0)} MXN</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2" disabled={acting === u.id} onClick={() => addFlag(u)}>+Flag</Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2" disabled={acting === u.id || u.flag_count === 0} onClick={() => removeFlag(u)}>-Flag</Button>
                      {u.account_status === "active" && (
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2" disabled={acting === u.id} onClick={() => updateUser(u.id, { account_status: "frozen" })}>Congelar</Button>
                      )}
                      {u.account_status === "frozen" && (
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2" disabled={acting === u.id} onClick={() => updateUser(u.id, { account_status: "active" })}>Descongelar</Button>
                      )}
                      {u.account_status !== "suspended" && (
                        <Button size="sm" variant="destructive" className="text-xs h-7 px-2" disabled={acting === u.id} onClick={() => updateUser(u.id, { account_status: "suspended" })}>Suspender</Button>
                      )}
                      {u.account_status === "suspended" && (
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2" disabled={acting === u.id} onClick={() => updateUser(u.id, { account_status: "active" })}>Reactivar</Button>
                      )}
                      {u.pending_penalty_balance > 0 && (
                        <Button size="sm" variant="ghost" className="text-xs h-7 px-2" disabled={acting === u.id} onClick={() => updateUser(u.id, { pending_penalty_balance: 0 })}>Limpiar saldo</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{filtered.length} usuarios</p>
    </div>
  );
}
