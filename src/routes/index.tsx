import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Sparkles, Users, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mini AI CRM — Run a smarter store" },
      {
        name: "description",
        content:
          "A simple e-commerce store with an AI-powered CRM. Manage products, track customers, and get AI insights — cash on delivery.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            Mini AI CRM
          </Link>
          <nav className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl">
            A simple store with a smart CRM.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Sell products with cash on delivery, understand your customers with AI, and grow with
            personalized follow-ups — all in one tool built for small businesses.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/login">
              <Button size="lg">Create your store</Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-3">
          <Feature
            icon={<ShoppingBag className="h-5 w-5" />}
            title="Simple shop"
            text="Add products, share your store link, take orders. Cash on delivery only."
          />
          <Feature
            icon={<Users className="h-5 w-5" />}
            title="Built-in CRM"
            text="Every order builds a customer profile with spend, frequency, and segment."
          />
          <Feature
            icon={<BarChart3 className="h-5 w-5" />}
            title="AI insights"
            text="See likely repeat buyers, write follow-up emails, and predict new-product fit."
          />
        </section>
      </main>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
