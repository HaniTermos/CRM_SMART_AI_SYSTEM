<<<<<<< HEAD
import { createFileRoute } from "@tanstack/react-router";
import { CrmPage } from "@/components/crm/crm-page";

export const Route = createFileRoute("/_admin/crm")({
  component: CrmRoute,
});

function CrmRoute() {
  return <CrmPage />;
}
=======
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

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline CRM</TabsTrigger>
          <TabsTrigger value="campaigns">Email Campaign</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6">
          {currentPipeline ? (
            <PipelineBoard pipelineId={currentPipeline.id} storeId={store!.id} />
          ) : (
            !isCreatingPipeline && (
              <div className="text-center p-12 border border-dashed rounded-lg bg-muted/20">
                <h3 className="text-lg font-medium">No pipeline configured</h3>
                <p className="text-muted-foreground mt-1 mb-4">Create your first sales pipeline to start tracking deals.</p>
                <Button onClick={() => setIsCreatingPipeline(true)}>Create Pipeline</Button>
              </div>
            )
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <CampaignsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PipelineBoard({ pipelineId, storeId }: { pipelineId: string, storeId: string }) {
  const queryClient = useQueryClient();
  const [newStageName, setNewStageName] = useState("");
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealValue, setNewDealValue] = useState("");
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isDealOpen, setIsDealOpen] = useState(false);

  const { data: stages } = useQuery({
    queryKey: ["crm-stages", pipelineId],
    queryFn: async () => {
      const res = await api.get(`/crm/${storeId}/pipelines/${pipelineId}/stages`);
      return res.data.data;
    }
  });

  const { data: deals } = useQuery({
    queryKey: ["crm-deals", pipelineId],
    queryFn: async () => {
      const res = await api.get(`/crm/${storeId}/deals?pipelineId=${pipelineId}`);
      return res.data.data;
    }
  });

  const { data: customers } = useQuery({
    queryKey: ["customers", storeId],
    queryFn: async () => {
      const res = await api.get(`/customers/${storeId}`);
      return res.data.data;
    }
  });

  const createStageMut = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post(`/crm/${storeId}/pipelines/${pipelineId}/stages`, { name, position: stages?.length || 0 });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-stages"] });
      setNewStageName("");
    }
  });

  const createDealMut = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/crm/${storeId}/deals`, {
        pipeline_id: pipelineId,
        stage_id: selectedStageId,
        customer_id: selectedCustomerId,
        title: newDealTitle,
        value: parseFloat(newDealValue) || 0,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      setIsDealOpen(false);
      setNewDealTitle("");
      setNewDealValue("");
      setSelectedCustomerId(null);
    }
  });

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] items-start">
      {stages?.map((stage: any) => (
        <div key={stage.id} className="min-w-[300px] w-[300px] bg-muted/30 rounded-lg flex flex-col max-h-full">
          <div className="p-3 font-semibold border-b border-border/50 flex justify-between items-center bg-muted/50 rounded-t-lg">
            {stage.name}
            <Badge variant="secondary" className="text-xs">
              {deals?.filter((d: any) => d.stage_id === stage.id).length || 0}
            </Badge>
          </div>
          <div className="p-2 flex flex-col gap-2 flex-1 overflow-y-auto min-h-[50px]">
            {deals?.filter((d: any) => d.stage_id === stage.id).map((deal: any) => (
              <Card key={deal.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="p-3">
                  <div className="font-medium text-sm">{deal.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{deal.customer_name || 'No contact'}</div>
                  <div className="text-sm font-semibold mt-2">${Number(deal.value).toFixed(2)}</div>
                </CardContent>
              </Card>
            ))}
            <Button 
              variant="ghost" 
              className="w-full text-xs text-muted-foreground mt-2"
              onClick={() => { setSelectedStageId(stage.id); setIsDealOpen(true); }}
            >
              + Add Deal
            </Button>
          </div>
        </div>
      ))}

      {/* Add Stage Column */}
      <div className="min-w-[300px] w-[300px] bg-muted/10 border border-dashed rounded-lg p-3 flex flex-col gap-2">
        <input 
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" 
          placeholder="New stage name" 
          value={newStageName} 
          onChange={e => setNewStageName(e.target.value)} 
        />
        <Button size="sm" onClick={() => createStageMut.mutate(newStageName)} disabled={!newStageName}>
          Add Stage
        </Button>
      </div>

      {/* Deal Creation Dialog */}
      <Dialog open={isDealOpen} onOpenChange={setIsDealOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Deal</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Deal Title</label>
              <input 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3" 
                value={newDealTitle} onChange={e => setNewDealTitle(e.target.value)} placeholder="e.g. Website Redesign" 
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
>>>>>>> ebf8e96b94724af6123191fffecb645770df3e69
