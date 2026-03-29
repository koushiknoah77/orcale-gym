import { use } from "react";
import { ReportView } from "@/components/report-view";

export const dynamic = "force-dynamic";

export default function ReportPage(props: PageProps<"/report/[sessionId]">) {
  const { sessionId } = use(props.params);

  return <ReportView sessionId={sessionId} />;
}
