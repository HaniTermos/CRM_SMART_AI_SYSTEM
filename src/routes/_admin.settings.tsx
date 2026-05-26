import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth-context";
import { useMyStore } from "@/lib/use-my-store";
import {
  inviteTeamMember,
  removeTeamMember,
  listTeamMembers,
  updateStoreSettings,
} from "@/lib/team.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings as SettingsIcon, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { data: store } = useMyStore();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("");
  const [shipping, setShipping] = useState("");

  useEffect(() => {
    if (!store) return;
    setName(store.name);
    setCurrency(store.currency);
    setShipping(String(store.shipping_fee));
  }, [store]);

  const isOwner = user && store && store.owner_user_id === user.id;

  const { data: members = [] } = useQuery({
    queryKey: ["team", store?.id],
    enabled: !!store?.id,
    queryFn: async () => listTeamMembers({ data: { storeId: store!.id } }),
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!store) throw new Error("No store");
      const fee = Number(shipping);
      if (!Number.isFinite(fee) || fee < 0) throw new Error("Invalid shipping fee");
      return updateStoreSettings({
        data: {
          storeId: store.id,
          name: name.trim(),
          currency: currency.trim(),
          shipping_fee: fee,
        },
      });
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["my-store"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "staff">("staff");

  const sendInvite = useMutation({
    mutationFn: async () => {
      if (!store) throw new Error("No store");
      return inviteTeamMember({
        data: { storeId: store.id, email: inviteEmail.trim(), role: inviteRole },
      });
    },
    onSuccess: () => {
      toast.success("Member added");
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["team", store?.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Invite failed"),
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      if (!store) throw new Error("No store");
      return removeTeamMember({ data: { storeId: store.id, userId } });
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["team", store?.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Remove failed"),
  });

  if (!store) {
    return (
      <div className="p-10 text-sm text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-10">
      <header>
        <h1 className="inline-flex items-center gap-2 text-3xl font-bold tracking-tight">
          <SettingsIcon className="h-6 w-6 text-primary" /> Settings
        </h1>
        <p className="mt-1 text-muted-foreground">Store details and team access.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Store</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="store-name">Name</Label>
            <Input id="store-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ship">Default shipping fee</Label>
              <Input id="ship" type="number" min={0} step="0.01" value={shipping} onChange={(e) => setShipping(e.target.value)} />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Store URL slug: <code className="rounded bg-muted px-1.5 py-0.5">/shop/{store.slug}</code></p>
          </div>
          <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
            {saveSettings.isPending ? "Saving…" : "Save settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="p-3">Member</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.user_id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="font-medium">{m.name ?? m.email ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </td>
                    <td className="p-3"><Badge variant={m.role === "owner" ? "default" : "secondary"}>{m.role}</Badge></td>
                    <td className="p-3 text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {m.role !== "owner" && m.user_id !== user?.id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember.mutate(m.user_id)}
                          disabled={removeMember.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {members.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No team members yet.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 rounded-md border bg-muted/20 p-4">
            <p className="text-sm font-medium">Add a team member</p>
            <p className="text-xs text-muted-foreground">
              The person must already have an account. Ask them to sign up at <code className="rounded bg-muted px-1 py-0.5">/login</code> first.
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <Input
                placeholder="teammate@example.com"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={!isOwner}
              />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "staff")}>
                <SelectTrigger className="w-32" disabled={!isOwner}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">staff</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => sendInvite.mutate()}
                disabled={!isOwner || sendInvite.isPending || !inviteEmail.trim()}
              >
                {sendInvite.isPending ? "Adding…" : "Add"}
              </Button>
            </div>
            {!isOwner ? (
              <p className="text-xs text-muted-foreground">Only the store owner can add new members.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
