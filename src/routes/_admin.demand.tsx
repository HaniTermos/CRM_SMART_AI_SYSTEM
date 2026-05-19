import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useMyStore } from "@/lib/use-my-store";
import { scoreProductIdea } from "@/lib/demand.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/demand")({
  component: DemandPage,
});

type DemandRow = {
  id: string;
  created_at: string;
  summary: string | null;
  next_action: string | null;
  email_subject: string | null;
  recommendations: unknown;
};

type Recs = {
  score?: number;
  confidence?: string;
  target_segments?: string[];
  suggested_price?: number;
  risks?: string[];
  positioning?: string;
  idea?: string;
  target_price?: number | null;
};

function asRecs(v: unknown): Recs {
  return (v && typeof v === "object" ? (v as Recs) : {});
}

function DemandPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const run = scoreProductIdea;

  const [idea, setIdea] = useState("");
  const [price, setPrice] = useState("");

  const { data: history = [] } = useQuery({
    queryKey: ["demand-history", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const res = await api.get(`/ai/${store!.id}/demand-history`);
      return res.data.data;
    },
  });

  const mutate = useMutation({
    mutationFn: async () => {
      if (!store) throw new Error("No store");
      const targetPrice = price.trim() ? Number(price) : undefined;
      if (targetPrice != null && !Number.isFinite(targetPrice)) throw new Error("Price must be a number");
      return run({ data: { storeId: store.id, idea: idea.trim(), targetPrice } });
    },
    onSuccess: () => {
      toast.success("Idea scored");
      setIdea("");
      setPrice("");
      qc.invalidateQueries({ queryKey: ["demand-history", store?.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Scoring failed"),
  });

  const latest = history[0];
  const latestRecs = useMemo(() => asRecs(latest?.recommendations), [latest]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-10">
      <header>
        <h1 className="inline-flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Lightbulb className="h-6 w-6 text-primary" /> Demand scoring
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pitch a new product idea. AI scores it against your catalog and recent buying patterns.
        </p>
      </header>

      <Card>
        <CardHeader><CardTitle>New idea</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idea">Describe the product</Label>
            <Textarea
              id="idea"
              rows={3}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. Organic cold-pressed coconut oil, 500ml glass bottle, sourced locally"
            />
          </div>
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="price">Target price ({store?.currency ?? "—"}) — optional</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="12.50"
            />
          </div>
          <Button onClick={() => mutate.mutate()} disabled={mutate.isPending || idea.trim().length < 3}>
            {mutate.isPending ? "Scoring…" : "Score idea"}
          </Button>
        </CardContent>
      </Card>

      {latest ? (
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Latest result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ScoreRow recs={latestRecs} />
            <p>{latest.summary}</p>
            {latestRecs.positioning ? (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Positioning</p>
                <p className="mt-1 font-medium">{latestRecs.positioning}</p>
              </div>
            ) : null}
            {latestRecs.target_segments?.length ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Target segments</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {latestRecs.target_segments.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
              </div>
            ) : null}
            {latestRecs.risks?.length ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Risks</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {latestRecs.risks.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-semibold">History</h2>
        {history.length <= 1 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No past ideas yet.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {history.slice(1).map((h) => {
              const r = asRecs(h.recommendations);
              return (
                <Card key={h.id}>
                  <CardContent className="space-y-2 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{h.email_subject ?? r.idea ?? "Idea"}</p>
                      <ScoreBadge score={r.score} confidence={r.confidence} />
                    </div>
                    <p className="text-muted-foreground">{h.summary}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(h.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ScoreRow({ recs }: { recs: Recs }) {
  const score = typeof recs.score === "number" ? Math.round(recs.score) : null;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div>
        <div className="text-4xl font-bold">{score ?? "—"}<span className="text-base text-muted-foreground">/100</span></div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Demand score</div>
      </div>
      {recs.confidence ? <Badge variant="outline">{recs.confidence} confidence</Badge> : null}
      {typeof recs.suggested_price === "number" ? (
        <Badge variant="secondary">Suggested price: {recs.suggested_price.toFixed(2)}</Badge>
      ) : null}
    </div>
  );
}

function ScoreBadge({ score, confidence }: { score?: number; confidence?: string }) {
  if (typeof score !== "number") return null;
  const tone = score >= 70 ? "default" : score >= 40 ? "secondary" : "outline";
  return <Badge variant={tone as "default" | "secondary" | "outline"}>{Math.round(score)}/100 · {confidence ?? "—"}</Badge>;
}
