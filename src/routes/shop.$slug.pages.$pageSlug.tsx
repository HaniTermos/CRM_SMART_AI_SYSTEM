import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SectionList } from "@/components/shop/section-renderer";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/shop/$slug/pages/$pageSlug")({
  component: ShopPage,
});

type PageData = {
  page: {
    id: string;
    title: string;
    slug: string;
    type: string;
    status: string;
    is_preview: boolean;
    seo_title: string | null;
    seo_description: string | null;
    social_image_url: string | null;
  };
  sections: Array<{
    id: string;
    store_id: string;
    page_id: string;
    type: string;
    position: number;
    is_visible: boolean;
    visibility: string;
    content: Record<string, any>;
    layout: Record<string, any>;
    appearance: Record<string, any>;
    background: Record<string, any>;
    responsive: Record<string, any>;
  }>;
};

function ShopPage() {
  const { slug, pageSlug } = useParams({ from: "/shop/$slug/pages/$pageSlug" });
  const search = useSearch({ from: "/shop/$slug/pages/$pageSlug" }) as { preview_token?: string };
  const previewToken = search.preview_token;

  const { data: store } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: async () => {
      const res = await api.get(`/public/stores/${slug}`);
      return res.data.data;
    },
  });

  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ["public-cms-page", slug, pageSlug, previewToken],
    enabled: !!store?.id,
    queryFn: async (): Promise<PageData> => {
      const url = previewToken
        ? `/public/stores/${slug}/cms/v2/pages/${pageSlug}?preview_token=${previewToken}`
        : `/public/stores/${slug}/cms/v2/pages/${pageSlug}`;
      const res = await api.get(url);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Loading page…
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <Card className="my-10">
        <CardContent className="p-10 text-center text-muted-foreground">
          <p className="font-semibold">Page not found</p>
          <p className="text-sm mt-1">This page may not be published yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="py-6">
      {pageData.page.is_preview && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          You are viewing a draft preview of this page.
        </div>
      )}
      <SectionList sections={pageData.sections} />
    </div>
  );
}
