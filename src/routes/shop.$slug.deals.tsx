import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Tag, Gift, Copy, CheckCircle2, Clock, User } from "lucide-react";

export const Route = createFileRoute("/shop/$slug/deals")({
  component: DealsPortal,
});

function DealsPortal() {
  const { slug } = useParams({ from: "/shop/$slug/deals" });
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deals, setDeals] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);
  const [redeemingDealId, setRedeemingDealId] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: async () => {
      const res = await api.get(`/public/stores/${slug}`);
      return res.data.data;
    },
    enabled: !!slug,
  });

  const handleLookup = async () => {
    if (!phone.trim()) {
      setQueryError("Please enter your phone number.");
      return;
    }

    setSearching(true);
    setQueryError(null);
    try {
      const res = await api.post(`/public/stores/${slug}/deals/lookup`, {
        phone: phone.trim(),
        email: email.trim() || null,
      });
      setCustomer(res.data.data.customer);
      setDeals(res.data.data.deals || []);
      if (res.data.data.deals.length === 0) {
        setQueryError("No deals found for this contact.");
      }
    } catch (error: any) {
      console.error("Lookup deals error:", error);
      setCustomer(null);
      setDeals([]);
      setQueryError(error?.response?.data?.error || error?.message || "Unable to lookup deals.");
      toast.error(error?.response?.data?.error || "Unable to lookup deals.");
    } finally {
      setSearching(false);
    }
  };

  const handleRedeem = async (dealId: string) => {
    if (!phone.trim()) {
      setQueryError("Please enter your phone number.");
      return;
    }

    setRedeemingDealId(dealId);
    setQueryError(null);

    try {
      const res = await api.post(`/public/stores/${slug}/deals/${dealId}/redeem`, {
        phone: phone.trim(),
        email: email.trim() || null,
      });

      const redeemedDeal = res.data.data.deal;
      setDeals((prev) => prev.map((deal) => (deal.id === dealId ? { ...deal, ...redeemedDeal } : deal)));
      setCustomer(res.data.data.customer || customer);
      toast.success("Deal redeemed — your coupon code is now visible!");
    } catch (error: any) {
      console.error("Redeem deal error:", error);
      setQueryError(error?.response?.data?.error || error?.message || "Unable to redeem deal.");
      toast.error(error?.response?.data?.error || "Unable to redeem deal.");
    } finally {
      setRedeemingDealId(null);
    }
  };

  if (storeLoading) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading store…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">My Deals & Coupons</h1>
          <p className="text-sm text-muted-foreground">Enter your phone number to view and redeem your exclusive deals.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Lookup</CardTitle>
          <CardDescription>Use the phone number you gave us when placing an order or visiting the store.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +96170123456" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Email (optional)</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@example.com" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleLookup} disabled={searching || !phone.trim()}>
              {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Lookup Deals"}
            </Button>
            {store && <span className="text-sm text-muted-foreground">Store: {store.name}</span>}
          </div>

          {queryError ? <p className="text-sm text-destructive">{queryError}</p> : null}
        </CardContent>
      </Card>

      {customer ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{customer.name || "Anonymous"}</p>
              <p className="text-muted-foreground">{customer.phone}</p>
              {customer.email ? <p className="text-muted-foreground">{customer.email}</p> : null}
            </div>
          </div>

          {deals.length > 0 ? (
            <div className="grid gap-4">
              {deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  storeCurrency={store?.currency}
                  onRedeem={() => handleRedeem(deal.id)}
                  redeeming={redeemingDealId === deal.id}
                />
              ))}
            </div>
          ) : (
            customer && !searching ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                <Tag className="mx-auto mb-3 h-8 w-8 opacity-40" />
                <p className="font-medium text-foreground">No active deals found</p>
                <p>Check back later or contact the store for promotions.</p>
              </div>
            ) : null
          )}
        </div>
      ) : null}
    </div>
  );
}

function DealCard({
  deal,
  storeCurrency,
  onRedeem,
  redeeming,
}: {
  deal: any;
  storeCurrency?: string;
  onRedeem: () => void;
  redeeming: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const status = deal.status || "open";
  const isRedeemed = !!deal.redemption_code;
  const currency = storeCurrency || "$";

  const copyCode = () => {
    if (!deal.redemption_code) return;
    navigator.clipboard.writeText(deal.redemption_code);
    setCopied(true);
    toast.success("Coupon code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={`overflow-hidden border ${isRedeemed ? "border-green-200 bg-green-50/30" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{deal.title}</CardTitle>
              <StatusBadge status={status} redeemed={isRedeemed} />
            </div>
            <CardDescription className="mt-1">
              {deal.pipeline_name} · {deal.stage_name}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary">
              {currency}{Number(deal.value || 0).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">Deal value</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Created {new Date(deal.created_at).toLocaleDateString()}
          </span>
          {deal.expected_close_date ? (
            <span>Expected close: {new Date(deal.expected_close_date).toLocaleDateString()}</span>
          ) : null}
        </div>

        {isRedeemed ? (
          <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-green-300 bg-green-100/60 p-5 text-center">
            <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
            <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />

            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Your Coupon Code</p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-green-800">
              {deal.redemption_code}
            </p>

            <div className="mt-3 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-green-300 bg-white text-green-700 hover:bg-green-50"
                onClick={copyCode}
              >
                {copied ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy code"}
              </Button>
            </div>

            {deal.redeemed_at ? (
              <p className="mt-2 text-xs text-green-600">
                Redeemed on {new Date(deal.redeemed_at).toLocaleDateString()}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-green-600/80">Use this code at checkout or show it in-store.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Ready to redeem?</p>
                <p className="text-xs text-muted-foreground">Click below to generate your unique coupon code.</p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={onRedeem}
                disabled={redeeming}
              >
                {redeeming ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redeeming...</>
                ) : (
                  <><Gift className="mr-2 h-4 w-4" /> Redeem Deal</>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, redeemed }: { status: string; redeemed: boolean }) {
  if (redeemed) {
    return (
      <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Redeemed
      </Badge>
    );
  }
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    open: { label: "Active", variant: "secondary" },
    won: { label: "Won", variant: "default" },
    lost: { label: "Expired", variant: "destructive" },
    pending: { label: "Pending", variant: "outline" },
  };
  const cfg = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
