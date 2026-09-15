import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignsManager } from "@/components/admin/CampaignsManager";

export const Route = createFileRoute("/_admin/crm")({
  component: CrmPage,
});

function CrmPage() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const queryClient = useQueryClient();
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState("");

  const { data: pipelines, isLoading: pipelinesLoading } = useQuery({
    queryKey: ["crm-pipelines", store?.id],
    queryFn: async () => {
      const res = await api.get(`/crm/${store!.id}/pipelines`);
      return res.data.data;
    },
    enabled: !!store?.id,
  });

  const createPipelineMut = useMutation({
    mutationFn: async (name: string) => {
      if (!store?.id) {
        throw new Error('Store not loaded yet. Please wait.');
      }
      const res = await api.post(`/crm/${store.id}/pipelines`, { name, description: "New Pipeline" });
      return res.data.data;
    },
    onSuccess: () => {
      if (store?.id) {
        queryClient.invalidateQueries({ queryKey: ["crm-pipelines", store.id] });
      }
      toast.success("Pipeline created");
      setIsCreatingPipeline(false);
      setNewPipelineName("");
    },
    onError: (error: any) => {
      console.error('Create pipeline error:', error);
      toast.error(error?.response?.data?.error || error?.message || "Unable to create pipeline. Please try again.");
    },
  });

  if (pipelinesLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  const currentPipeline = pipelines?.[0];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">Manage your sales pipeline and email campaigns.</p>
        </div>
        {!currentPipeline && !isCreatingPipeline && (
          <Button onClick={() => setIsCreatingPipeline(true)} disabled={storeLoading || !store?.id}>
            <Plus className="mr-2 h-4 w-4" /> Create Pipeline
          </Button>
        )}
      </div>

      {isCreatingPipeline && (
        <Card className="max-w-md">
          <CardHeader><CardTitle>New Pipeline</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <input 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
              placeholder="e.g. B2B Sales" 
              value={newPipelineName} 
              onChange={e => setNewPipelineName(e.target.value)} 
            />
            <Button onClick={() => createPipelineMut.mutate(newPipelineName)} disabled={!newPipelineName || storeLoading || !store?.id}>Save</Button>
            <Button variant="ghost" onClick={() => setIsCreatingPipeline(false)}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
          <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="mt-6">
          {currentPipeline ? (
            <PipelineBoard pipeline={currentPipeline} storeId={store!.id} />
          ) : (
            <div className="text-center p-12 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No active sales pipeline found. Click above to create one.</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="campaigns" className="mt-6">
          <CampaignsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PipelineBoard({ pipeline, storeId }: { pipeline: any; storeId: string }) {
  const queryClient = useQueryClient();
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealValue, setNewDealValue] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data: deals, isLoading } = useQuery({
    queryKey: ["crm-deals", pipeline.id],
    queryFn: async () => {
      const res = await api.get(`/crm/pipelines/${pipeline.id}/deals`);
      return res.data.data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers", storeId],
    queryFn: async () => {
      const res = await api.get(`/customers/${storeId}`);
      return res.data.data;
    },
  });

  const createDealMut = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/crm/pipelines/${pipeline.id}/deals`, {
        stage_id: selectedStageId,
        title: newDealTitle,
        value: parseFloat(newDealValue) || 0,
        customer_id: selectedCustomerId || null,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals", pipeline.id] });
      toast.success("Deal created");
      setSelectedStageId(null);
      setNewDealTitle("");
      setNewDealValue("");
      setSelectedCustomerId(null);
    },
  });

  const updateStageMut = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const res = await api.patch(`/crm/deals/${dealId}`, { stage_id: stageId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals", pipeline.id] });
    },
  });

  if (isLoading) return <div className="flex justify-center p-6"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {pipeline.stages?.map((stage: any) => {
        const stageDeals = deals?.filter((d: any) => d.stage_id === stage.id) || [];
        return (
          <div key={stage.id} className="w-80 shrink-0 bg-muted/40 p-4 rounded-lg flex flex-col gap-3">
            <div className="flex justify-between items-center font-semibold">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color || '#3b82f6' }} />
                {stage.name}
              </span>
              <Badge variant="secondary">{stageDeals.length}</Badge>
            </div>

            <div className="flex flex-col gap-2 min-h-[150px]">
              {stageDeals.map((deal: any) => (
                <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3 flex flex-col gap-1">
                    <span className="font-medium text-sm">{deal.title}</span>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                      <span className="font-semibold text-foreground">${deal.value}</span>
                      <span>{deal.customer_name || 'No contact'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button variant="ghost" className="w-full text-xs justify-start" onClick={() => setSelectedStageId(stage.id)}>
              <Plus className="mr-1 h-3 w-3" /> Add Deal
            </Button>
          </div>
        );
      })}

      <Dialog open={!!selectedStageId} onOpenChange={open => !open && setSelectedStageId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Deal</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <input 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3" 
                value={newDealTitle} onChange={e => setNewDealTitle(e.target.value)} placeholder="e.g. Enterprise License" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Value ($)</label>
              <input 
                type="number" className="flex h-10 w-full rounded-md border border-input bg-background px-3" 
                value={newDealValue} onChange={e => setNewDealValue(e.target.value)} placeholder="0.00" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact (optional)</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={selectedCustomerId || ""}
                onChange={e => setSelectedCustomerId(e.target.value || null)}
              >
                <option value="">— No contact —</option>
                {customers?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => createDealMut.mutate()} disabled={!newDealTitle}>Create Deal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
