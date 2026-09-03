<<<<<<< HEAD
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { PageLoader } from "../components/homepage/PageLoader";
import { SplashCursor } from "../components/homepage/SplashCursor";
import { HeroSection } from "../components/homepage/HeroSection";
import { MagicBento } from "../components/homepage/MagicBento";
import { HorizontalGallery } from "../components/homepage/HorizontalGallery";
import { CurvedLoop } from "../components/homepage/CurvedLoop";
import { PricingFlipCards } from "../components/homepage/PricingFlipCards";
import { FAQSection } from "../components/homepage/FAQSection";
import { useSmoothScroll } from "../hooks/useSmoothScroll";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [loaded, setLoaded] = useState(false);
  useSmoothScroll();

  return (
    <>
      <AnimatePresence>
        {!loaded && <PageLoader onComplete={() => setLoaded(true)} />}
      </AnimatePresence>

      {loaded && (
        <>
          <SplashCursor
            SIM_RESOLUTION={128}
            DYE_RESOLUTION={1440}
            DENSITY_DISSIPATION={3.5}
            VELOCITY_DISSIPATION={2}
            PRESSURE={0.1}
            CURL={3}
            SPLAT_RADIUS={0.2}
            SPLAT_FORCE={6000}
            COLOR_UPDATE_SPEED={10}
          />

          <main className="relative bg-[#F9FAFB] text-slate-900 overflow-x-hidden">
            <HeroSection />
            <MagicBento />
            <HorizontalGallery />
            <CurvedLoop />
            <PricingFlipCards />
            <FAQSection />
          </main>
        </>
      )}
    </>
  );
}
=======
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Sparkles,
  Users,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Twitter,
  Instagram,
  Linkedin,
  Github,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useState, forwardRef } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";

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

const faqCategories = [
  { id: "general", label: "General Questions" },
  { id: "support", label: "Support team" },
  { id: "misc", label: "Miscellaneous" },
  { id: "technical", label: "Technical" },
  { id: "billing", label: "Billing" },
];

{
  /* FAQ Data */
}
const faqData: Record<string, { q: string; a: string }[]> = {
  general: [
    {
      q: "How do I add a new customer to the CRM?",
      a: "Navigate to the Customers section from the sidebar, then click the 'Add Customer' button in the top-right corner. Fill out the required fields and click Save.",
    },
    {
      q: "Can I export my data to Excel or CSV?",
      a: "Yes. On any report or list view, click the Export button and choose your preferred format (Excel, CSV, or PDF) from the dropdown menu.",
    },
    {
      q: "Is there a mobile app available?",
      a: "We currently offer a fully responsive web application. A native mobile app is planned for Q4 2026. The web app works great on mobile browsers.",
    },
    {
      q: "Hani Malik l Coding?",
      a: "Yes ofcouse he is!!!",
    },
  ],
  support: [
    {
      q: "How do I contact the support team?",
      a: "You can reach us via the in-app chat widget, email at support@miniaicrm.com, or through the Contact page. We typically respond within 2 hours during business days.",
    },
    {
      q: "What are your support hours?",
      a: "Our support team is available Monday through Friday, 9 AM to 6 PM EST. Plus plan users get priority support with extended hours.",
    },
  ],
  misc: [
    {
      q: "Can I invite team members?",
      a: "Go to Settings > Team Management and click 'Invite Member'. Enter their email address and assign a role (Admin, Manager, or Viewer). They'll receive an invitation link.",
    },
    {
      q: "How do I reset my password?",
      a: "Click your profile avatar in the top-right, go to Settings > Security, and select 'Change Password'. You'll receive a confirmation email to verify the change.",
    },
  ],
  technical: [
    {
      q: "What browsers are supported?",
      a: "We support the latest versions of Chrome, Firefox, Safari, and Edge. Internet Explorer is not supported.",
    },
    {
      q: "Is my data secure?",
      a: "Yes. All data is encrypted in transit (TLS 1.3) and at rest. We use SOC 2 Type II certified infrastructure and perform regular security audits.",
    },
  ],
  billing: [
    {
      q: "What payment methods are accepted?",
      a: "We accept all major credit cards (Visa, MasterCard, Amex) and PayPal. Enterprise customers can request invoice-based billing.",
    },
    {
      q: "How do I cancel my subscription?",
      a: "Go to Settings > Billing and click 'Cancel Subscription'. You'll retain access until the end of your current billing period.",
    },
  ],
};

function Landing() {
  const [activeCategory, setActiveCategory] = useState("general");
  const { user, loading } = useAuth();
  const isLoggedIn = !loading && !!user;

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-4 left-0 right-0 z-50 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between rounded-full bg-white/60 backdrop-blur border border-white/40 shadow-lg px-4 py-3">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-5 w-5 text-primary" />
              Mini AI CRM
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                About Us
              </Link>
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Services
              </Link>
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Blog
              </Link>
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Contact
              </Link>
            </nav>
            <nav className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      localStorage.removeItem("smartstore_token");
                      window.location.href = "/login";
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="sm">Get started</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
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
            {isLoggedIn ? (
              <Link to="/dashboard">
                <Button size="lg">Go to dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg">Create your store</Button>
              </Link>
            )}
          </div>

          {/*Dashboard pic*/}
          <div className="mt-15">
            <img
              src="public/images/dashboard-ss.jpg"
              alt="Mini AI CRM Dashboard"
              className="mx-auto w-full max-w-5xl rounded-2xl border shadow-2xl"
            />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pt-4 pb-24">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center justify-center rounded-full bg-white/60 backdrop-blur border border-white/40 shadow-lg px-4 py-2">
              <span className="text-sm font-semibold tracking-wide text-slate-800">About Us</span>
            </div>
          </div>

          <div className="mt-15 grid gap-8 md:grid-cols-2 items-center">
            {/* image section */}
            <div className="relative">
              <img
                src="public/images/about-img.jpg"
                alt="Mini AI CRM"
                className="rounded-2xl border shadow-2xl w-full h-auto object-cover"
              />
            </div>

            {/* text section */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                We help small stores grow with smart CRM
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                Mini AI CRM is built by a small team that believes CRM should be simple, affordable,
                and actually used. We combine basic e‑commerce with AI insights so you can focus on
                selling, not spreadsheets.
              </p>
              <div className="mt-6">
                <Link to="/" className="inline-flex">
                  <Button variant="outline" size="sm">
                    Learn more about us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pt-4 pb-24">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center justify-center rounded-full bg-white/60 backdrop-blur border border-white/40 shadow-lg px-4 py-2">
              <span className="text-sm font-semibold tracking-wide text-slate-800">Plans</span>
            </div>
          </div>

          {/*Basic Plan*/}
          <div className="mt-15 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 hover:ring-1 hover:ring-primary/30">
              <h1 className="text-sm font-semibold text-slate-800">Basic</h1>
              <p className="mt-2 text-3xl font-bold">
                $15<span className="text-base font-medium text-muted-foreground">/mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Product management</li>
                <li>• Basic customer profiles</li>
                <li>• Order tracking</li>
              </ul>
              <Button className="mt-6 w-full" size="sm">
                Start free trial
              </Button>
            </div>

            {/*Advanced Plan*/}
            <div className="rounded-2xl border bg-card p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 hover:ring-1 hover:ring-primary/30">
              <h1 className="text-sm font-semibold text-slate-800">Advanced</h1>
              <p className="mt-2 text-3xl font-bold">
                $21<span className="text-base font-medium text-muted-foreground">/mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Everything in Basic</li>
                <li>• Advanced customer segmentation</li>
                <li>• AI insights and recommendations</li>
              </ul>
              <Button className="mt-6 w-full" size="sm">
                Start free trial
              </Button>
            </div>

            {/*Plus Plan*/}
            <div className="rounded-2xl border bg-card p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 hover:ring-1 hover:ring-primary/30">
              <h1 className="text-sm font-semibold text-slate-800">Plus</h1>
              <p className="mt-2 text-3xl font-bold">
                $29
                <span className="text-base font-medium text-muted-foreground">/mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Everything in Advanced</li>
                <li>• Custom branding and themes</li>
                <li>• Priority support</li>
              </ul>
              <Button className="mt-6 w-full" size="sm">
                Start free trial
              </Button>
            </div>
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

        <section className="mx-auto max-w-5xl px-6 pb-24">
          {/* Section Pill */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center justify-center rounded-full bg-white/60 backdrop-blur border border-white/40 shadow-lg px-4 py-2">
              <span className="text-sm font-semibold tracking-wide text-slate-800">FAQ</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto">
              Our platform is built to help you work smarter, not harder. It adapts to your needs
              and supports your goals. Make the most of every feature.
            </p>
          </div>

          {/* Two-Column Layout */}
          <div className="grid gap-6 lg:gap-8 lg:grid-cols-12 items-start">
            {/* Left: Category Navigation */}
            <div className="lg:col-span-4 space-y-2">
              {faqCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl px-5 py-4 text-sm font-medium transition-all duration-200 border",
                    activeCategory === cat.id
                      ? "bg-white border-white/60 shadow-md text-slate-900"
                      : "bg-white/40 border-transparent text-slate-600 hover:bg-white/70 hover:text-slate-800",
                  )}
                >
                  {cat.label}
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-all duration-200",
                      activeCategory === cat.id
                        ? "text-slate-900 translate-x-0.5"
                        : "text-slate-400",
                    )}
                  />
                </button>
              ))}
            </div>

            {/* Right: Accordion Panel */}
            <div className="lg:col-span-8 bg-white/60 backdrop-blur rounded-2xl border border-white/40 shadow-lg p-2 md:p-6">
              <Accordion
                key={activeCategory}
                type="single"
                collapsible
                defaultValue="item-0"
                className="w-full"
              >
                {faqData[activeCategory]?.map((faq, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`item-${idx}`}
                    className="border-b border-slate-200/60 last:border-b-0"
                  >
                    <FaqTrigger className="px-2 md:px-4">{faq.q}</FaqTrigger>
                    <AccordionContent className="px-2 md:px-4 text-muted-foreground text-sm leading-relaxed pb-5">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Wrapper creates the overlap context */}
        <div className="relative">
          {/* CTA Banner */}
          <section className="relative z-10 mx-auto max-w-5xl px-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-800 to-slate-950 px-6 py-16 md:py-20 text-center">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-700/25 via-transparent to-transparent" />
              <div className="relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Ready to transform your store?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
                  Join thousands of small business owners who are managing customers smarter and
                  growing faster with Mini AI CRM.
                </p>
                <div className="mt-8 flex justify-center">
                  {isLoggedIn ? (
                    <Link to="/dashboard">
                      <Button
                        size="lg"
                        className="rounded-full bg-white px-8 text-slate-900 hover:bg-slate-100"
                      >
                        Go to dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/login">
                      <Button
                        size="lg"
                        className="rounded-full bg-white px-8 text-slate-900 hover:bg-slate-100"
                      >
                        Start for free
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* gray zone */}
          <div className="relative z-0 -mt-14 md:-mt-20 bg-slate-100">
            <footer className="mx-auto max-w-5xl px-6 pb-12 pt-16 md:pt-24">
              <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
                {/* Brand Column */}
                <div className="lg:col-span-5">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 font-semibold text-slate-900"
                  >
                    <Sparkles className="h-5 w-5 text-primary" />
                    Mini AI CRM
                  </Link>
                  <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                    Mini AI CRM empowers small stores to sell smarter, understand customers better,
                    and grow with AI-powered insights.
                  </p>

                  <div className="mt-6 flex items-center gap-4">
                    <a
                      href="#"
                      className="text-muted-foreground transition-colors hover:text-slate-900"
                    >
                      <Twitter className="h-4 w-4" />
                      <span className="sr-only">Twitter</span>
                    </a>
                    <a
                      href="#"
                      className="text-muted-foreground transition-colors hover:text-slate-900"
                    >
                      <Instagram className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </a>
                    <a
                      href="#"
                      className="text-muted-foreground transition-colors hover:text-slate-900"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </a>
                    <a
                      href="#"
                      className="text-muted-foreground transition-colors hover:text-slate-900"
                    >
                      <Github className="h-4 w-4" />
                      <span className="sr-only">GitHub</span>
                    </a>
                  </div>
                </div>

                {/* Link Columns */}
                <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-slate-900">Product</h4>
                    <ul className="space-y-2.5">
                      <li>
                        <Link
                          to="/"
                          className="text-sm text-muted-foreground transition-colors hover:text-slate-900"
                        >
                          Features
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/"
                          className="text-sm text-muted-foreground transition-colors hover:text-slate-900"
                        >
                          Pricing
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/"
                          className="text-sm text-muted-foreground transition-colors hover:text-slate-900"
                        >
                          Integrations
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/"
                          className="text-sm text-muted-foreground transition-colors hover:text-slate-900"
                        >
                          Changelog
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-slate-900">Resources</h4>
                    <ul className="space-y-2.5">
                      <li>
                        <Link
                          to="/"
                          className="text-sm text-muted-foreground transition-colors hover:text-slate-900"
                        >
                          Documentation
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/"
                          className="text-sm text-muted-foreground transition-colors hover:text-slate-900"
                        >
                          Tutorials
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/"
                          className="text-sm text-muted-foreground transition-colors hover:text-slate-900"
                        >
                          Blog
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/"
                          className="text-sm text-muted-foreground transition-colors hover:text-slate-900"
                        >
                          Support
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-slate-900">Company</h4>
                    <ul className="space-y-2.5">
                      <li>
                        <Link
                          to="/"
                          className="text-sm text-muted-foreground transition-colors hover:text-slate-900"
                        >
                          About
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/"
                          className="text-sm text-muted-foreground transition-colors hover:text-slate-900"
                        >
                          Careers
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/"
                          className="text-sm text-muted-foreground transition-colors hover:text-slate-900"
                        >
                          Contact
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/"
                          className="text-sm text-muted-foreground transition-colors hover:text-slate-900"
                        >
                          Partners
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="mt-12 flex flex-col items-center gap-4 pt-8 sm:flex-row sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} Mini AI CRM. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                  <Link
                    to="/"
                    className="text-sm text-muted-foreground underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900 hover:decoration-slate-900"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/"
                    className="text-sm text-muted-foreground underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900 hover:decoration-slate-900"
                  >
                    Terms of Service
                  </Link>
                  <Link
                    to="/"
                    className="text-sm text-muted-foreground underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900 hover:decoration-slate-900"
                  >
                    Cookies Settings
                  </Link>
                </div>
              </div>
            </footer>
          </div>
        </div>
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

const FaqTrigger = forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "group flex flex-1 items-center justify-between py-5 text-base font-medium cursor-pointer transition-all text-left",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
FaqTrigger.displayName = "FaqTrigger";
>>>>>>> ebf8e96b94724af6123191fffecb645770df3e69
