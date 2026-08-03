import { createFileRoute } from "@tanstack/react-router";
import { ReviewsPage } from "@/components/reviews/reviews-page";

export const Route = createFileRoute("/_admin/reviews")({
  component: ReviewsRoute,
});

function ReviewsRoute() {
  return <ReviewsPage />;
}