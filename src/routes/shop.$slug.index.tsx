import { useState } from "react";
import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SectionList } from "@/components/shop/section-renderer";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/shop/$slug/")({
  component: ShopHome,
});

type HomePageData = {
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

function ShopHome() {
  const { slug } = useParams({ from: "/shop/$slug/" });
  const search = useSearch({ from: "/shop/$slug/" }) as { preview_token?: string };
  const previewToken = search.preview_token;

  const { data: store } = useQuery({
    queryKey: ["public-store", slug],
    queryFn: async () => {
      const res = await api.get(`/public/stores/${slug}`);
      return res.data.data;
    },
  });

  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ["public-cms-home", slug, previewToken],
    enabled: !!store?.id,
    queryFn: async (): Promise<HomePageData> => {
      const url = previewToken
        ? `/public/stores/${slug}/cms/v2/pages?preview_token=${previewToken}`
        : `/public/stores/${slug}/cms/v2/pages`;
      const res = await api.get(url);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Loading storefront…
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <Card className="my-10">
        <CardContent className="p-10 text-center text-muted-foreground">
          <p className="font-semibold">Homepage not available</p>
          <p className="text-sm mt-1">This store has not published a homepage yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="py-2">
      {pageData.page.is_preview && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          You are viewing a draft preview of the homepage.
        </div>
      )}
      <SectionList sections={pageData.sections} />
    </div>
  );
}
