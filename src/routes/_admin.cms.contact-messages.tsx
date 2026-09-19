import { createFileRoute } from "@tanstack/react-router";
import { CmsContactMessagesPage } from "@/components/cms/cms-contact-messages-page";

export const Route = createFileRoute("/_admin/cms/contact-messages")({
  component: CmsContactMsgsRoute,
});

function CmsContactMsgsRoute() {
  return <CmsContactMessagesPage />;
}
