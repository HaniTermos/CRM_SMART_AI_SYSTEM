import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { generateCustomerInsight } from "@/lib/ai.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Mail, Copy } from "lucide-react";
import { toast } from "sonner";

type Insight = {
  id: string;
  summary: string | null;
  next_action: string | null;
  email_subject: string | null;
  email_body: string | null;
  recommendations: unknown;
  created_at: string;
};

import { api } from "@/lib/api";

export function AiInsightCard({
  customerId,
  storeId,
  customerEmail,
}: {
  customerId: string;
  storeId: string;
  customerEmail: string | null;
}) {
  const qc = useQueryClient();

  const { data: latest } = useQuery({
    queryKey: ["ai-insight", customerId],
    queryFn: async () => {
      const res = await api.get(`/ai/${storeId}/customer/${customerId}`);
      const list = res.data.data;
      return list.length > 0 ? (list[0] as Insight) : null;
    },
  });

  const run = useMutation({
    mutationFn: async () => generateCustomerInsight({ data: { storeId, customerId } }),
    onSuccess: () => {
      toast.success("Insight generated");
      qc.invalidateQueries({ queryKey: ["ai-insight", customerId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "AI failed"),
  });

  const recs = Array.isArray(latest?.recommendations)
    ? (latest!.recommendations as string[])
    : [];

  const copyEmail = async () => {
    if (!latest?.email_body) return;
    const text = `Subject: ${latest.email_subject ?? ""}\n\n${latest.email_body}`;
    await navigator.clipboard.writeText(text);
    toast.success("Email copied");
  };

  const mailtoHref =
    customerEmail && latest?.email_body
      ? `mailto:${customerEmail}?subject=${encodeURIComponent(latest.email_subject ?? "")}&body=${encodeURIComponent(latest.email_body)}`
      : undefined;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> AI insight
          </h3>
          <Button size="sm" onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending ? "Thinking…" : latest ? "Regenerate" : "Generate"}
          </Button>
        </div>

        {!latest ? (
          <p className="text-sm text-muted-foreground">
            Click Generate to get a behavior summary, recommended next step, and a draft follow-up email.
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Summary</p>
              <p className="mt-1">{latest.summary}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Next action</p>
              <p className="mt-1 font-medium">{latest.next_action}</p>
            </div>
            {recs.length > 0 ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommend</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {recs.map((r) => (
                    <Badge key={r} variant="secondary">{r}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {latest.email_subject ? (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email draft</p>
                <p className="mt-1 font-medium">{latest.email_subject}</p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{latest.email_body}</pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={copyEmail}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                  </Button>
                  {mailtoHref ? (
                    <a href={mailtoHref}>
                      <Button size="sm">
                        <Mail className="mr-1.5 h-3.5 w-3.5" /> Open in mail app
                      </Button>
                    </a>
                  ) : (
                    <span className="self-center text-xs text-muted-foreground">
                      Add an email to send directly.
                    </span>
                  )}
                </div>
              </div>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              Generated {new Date(latest.created_at).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
