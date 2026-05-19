import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { submitReview } from "@/lib/reviews.functions";
import { StarRating, StarPicker } from "@/components/reviews/Stars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function ProductReviews({
  storeSlug,
  productId,
}: {
  storeSlug: string;
  productId: string;
}) {
  const qc = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ["public-reviews", productId],
    queryFn: async () => {
      const res = await api.get(`/public/products/${productId}/reviews`);
      return res.data.data;
    },
  });

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      submitReview({
        storeSlug,
        productId,
        authorName: name.trim(),
        phone: phone.trim() || undefined,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: (res) => {
      toast.success(
        res.verified
          ? "Thanks! Your verified review will appear shortly."
          : "Thanks! Your review will appear once approved.",
      );
      setShowForm(false);
      setName("");
      setPhone("");
      setComment("");
      setRating(5);
      qc.invalidateQueries({ queryKey: ["public-reviews", productId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Reviews</h2>
          {reviews.length > 0 ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <StarRating value={avg} />
              <span>
                {avg.toFixed(1)} · {reviews.length} review
                {reviews.length === 1 ? "" : "s"}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No reviews yet.</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "Write a review"}
        </Button>
      </header>

      {showForm ? (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="grid gap-2">
            <Label>Your rating</Label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div className="grid gap-2">
            <Label>Your name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Phone (optional — verifies your purchase)</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={40}
            />
          </div>
          <div className="grid gap-2">
            <Label>Comment</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="What did you think?"
            />
          </div>
          <Button
            onClick={() => {
              if (!name.trim()) {
                toast.error("Please enter your name");
                return;
              }
              submit.mutate();
            }}
            disabled={submit.isPending}
          >
            {submit.isPending ? "Submitting…" : "Submit review"}
          </Button>
        </div>
      ) : null}

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.author_name}</span>
                {r.verified_purchase ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Verified purchase
                  </Badge>
                ) : null}
              </div>
              <StarRating value={r.rating} size={14} />
            </div>
            {r.comment ? (
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {r.comment}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
