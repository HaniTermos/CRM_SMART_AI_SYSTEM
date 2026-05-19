import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_admin/products/new")({
  component: NewProduct,
});

function NewProduct() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">New product</h1>
        <p className="mt-1 text-muted-foreground">Add a product to your catalog.</p>
      </header>
      <ProductForm />
    </div>
  );
}
