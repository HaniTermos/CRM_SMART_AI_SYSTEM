import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/shop/$slug/thanks/$orderNumber")({
  component: ThanksPage,
});

function ThanksPage() {
  const { slug, orderNumber } = useParams({ from: "/shop/$slug/thanks/$orderNumber" });
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg border bg-card p-8 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
      <h1 className="text-2xl font-bold">Thank you!</h1>
      <p className="text-muted-foreground">
        Your order <span className="font-mono font-medium text-foreground">{orderNumber}</span> has been
        placed. We'll contact you to confirm delivery. Payment is cash on delivery.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link to="/shop/$slug/track" params={{ slug }} search={{ o: orderNumber }}>
          <Button>Track order</Button>
        </Link>
        <Link to="/shop/$slug" params={{ slug }}>
          <Button variant="outline">Back to shop</Button>
        </Link>
      </div>
    </div>
  );
}
