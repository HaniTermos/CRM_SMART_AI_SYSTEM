import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMyStore } from "@/lib/use-my-store";
import { listReviews, setReviewStatus, deleteReview } from "@/lib/reviews.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/reviews/Stars";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Star, Check, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/reviews")({
  component: ReviewsPage,
});

type Status = "pending" | "approved" | "hidden" | "all";

function ReviewsPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const listFn = useServerFn(listReviews);
  const setStatusFn = useServerFn(setReviewStatus);
  const deleteFn = useServerFn(deleteReview);

  const [tab, setTab] = useState<Status>("pending");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", store?.id, tab],
    enabled: !!store?.id,
    queryFn: () => listFn({ data: { storeId: store!.id, status: tab } }),
  });

  const update = useMutation({
    mutationFn: (input: { id: string; status: "pending" | "approved" | "hidden" }) =>
      setStatusFn({ data: { storeId: store!.id, ...input } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", store?.id] });
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      deleteFn({ data: { storeId: store!.id, id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", store?.id] });
      toast.success("Deleted");
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Star className="h-7 w-7 text-yellow-400" />
          Reviews
        </h1>
        <p className="mt-1 text-muted-foreground">
          Moderate customer reviews. New submissions land in Pending.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="hidden">Hidden</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base capitalize">{tab} reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing here.</p>
              ) : (
                <div className="divide-y">
                  {reviews.map((r) => (
                    <div key={r.id} className="space-y-2 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.author_name}</span>
                          <StarRating value={r.rating} size={14} />
                          {r.verified_purchase ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Verified
                            </Badge>
                          ) : null}
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {r.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">
                        On{" "}
                        <Link
                          to="/products/$id"
                          params={{ id: r.product_id }}
                          className="font-medium text-primary underline"
                        >
                          {r.product_name}
                        </Link>
                      </p>
                      {r.comment ? (
                        <p className="whitespace-pre-line text-sm text-muted-foreground">
                          {r.comment}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {r.status !== "approved" ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              update.mutate({ id: r.id, status: "approved" })
                            }
                          >
                            <Check className="mr-1 h-3 w-3" /> Approve
                          </Button>
                        ) : null}
                        {r.status !== "hidden" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              update.mutate({ id: r.id, status: "hidden" })
                            }
                          >
                            <EyeOff className="mr-1 h-3 w-3" /> Hide
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Delete this review?")) remove.mutate(r.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
