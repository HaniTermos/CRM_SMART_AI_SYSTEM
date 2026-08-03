import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_admin/products/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Edit product</h1>
        <p className="mt-1 text-muted-foreground">Update your product details.</p>
      </header>
      <ProductForm productId={id} />
    </div>
  );
}
