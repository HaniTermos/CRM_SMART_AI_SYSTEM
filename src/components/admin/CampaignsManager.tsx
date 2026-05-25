import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Send, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEGMENTS = ["new", "active", "vip", "at_risk", "churned"] as const;

export function CampaignsManager() {
  const { data: store } = useMyStore();
  const storeId = store?.id;
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [targetSegment, setTargetSegment] = useState<string>("");

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns", storeId],
    queryFn: async () => {
      const res = await api.get(`/campaigns/${storeId}`);
      return res.data.data;
    },
    enabled: !!storeId,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/campaigns/${storeId}`, {
        name,
        subject,
        content_html: contentHtml,
        target_segment: targetSegment || null,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Campaign created");
      queryClient.invalidateQueries({ queryKey: ["campaigns", storeId] });
      resetForm();
      setIsOpen(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to create campaign"),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/campaigns/${storeId}/${editingCampaign.id}`, {
        name,
        subject,
        content_html: contentHtml,
        target_segment: targetSegment || null,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Campaign updated");
      queryClient.invalidateQueries({ queryKey: ["campaigns", storeId] });
      resetForm();
      setIsOpen(false);
      setEditingCampaign(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to update campaign"),
  });

  const sendMut = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await api.post(`/campaigns/${storeId}/${campaignId}/send`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Campaign sent");
      queryClient.invalidateQueries({ queryKey: ["campaigns", storeId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to send campaign"),
  });

  function resetForm() {
    setName("");
    setSubject("");
    setContentHtml("");
    setTargetSegment("");
  }

  function openCreate() {
    setEditingCampaign(null);
    resetForm();
    setIsOpen(true);
  }

  function openEdit(campaign: any) {
    setEditingCampaign(campaign);
    setName(campaign.name);
    setSubject(campaign.subject);
    setContentHtml(campaign.content_html || "");
    setTargetSegment(campaign.target_segment || "");
    setIsOpen(true);
  }

  if (!storeId) {
    return <div className="p-8 text-sm text-muted-foreground">Loading store…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Email Campaigns</h2>
          <p className="text-sm text-muted-foreground">Create and send email campaigns to your customers.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Campaign
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <Mail className="mx-auto h-8 w-8 mb-3 text-muted-foreground/60" />
            <p>No campaigns yet.</p>
            <p className="text-sm mt-1">Create your first email campaign to reach your customers.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign: any) => (
            <Card key={campaign.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <CampaignStatusBadge status={campaign.status} />
                      {campaign.target_segment && (
                        <Badge variant="outline" className="text-xs">{campaign.target_segment}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">Subject: {campaign.subject}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Sent: {campaign.sent_count ?? 0}</span>
                      <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEdit(campaign)}>
                      Edit
                    </Button>
                    {campaign.status !== "sending" && campaign.status !== "sent" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (confirm(`Send "${campaign.name}"?`)) {
                            sendMut.mutate(campaign.id);
                          }
                        }}
                        disabled={sendMut.isPending}
                      >
                        {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
                        Send
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Edit Campaign" : "New Campaign"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-2">
              <Label>Campaign name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Sale" />
            </div>
            <div className="space-y-2">
              <Label>Email subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Our biggest sale of the year!" />
            </div>
            <div className="space-y-2">
              <Label>Target segment</Label>
              <Select value={targetSegment} onValueChange={setTargetSegment}>
                <SelectTrigger>
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All customers</SelectItem>
                  {SEGMENTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email content (HTML)</Label>
              <Textarea
                value={contentHtml}
                onChange={(e) => setContentHtml(e.target.value)}
                rows={6}
                placeholder="<p>Hello {{name}},</p><p>...</p>"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setIsOpen(false); setEditingCampaign(null); resetForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={() => (editingCampaign ? updateMut.mutate() : createMut.mutate())}
                disabled={!name || !subject || (editingCampaign ? updateMut.isPending : createMut.isPending)}
              >
                {editingCampaign ? (updateMut.isPending ? "Saving…" : "Save Changes") : (createMut.isPending ? "Creating…" : "Create Campaign")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, any> = {
    draft: "secondary",
    sending: "default",
    sent: "default",
    cancelled: "destructive",
  };
  return (
    <Badge variant={variantMap[status] || "secondary"} className="text-xs capitalize">
      {status}
    </Badge>
  );
}
