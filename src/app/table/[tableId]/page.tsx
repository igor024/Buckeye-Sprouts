import { notFound, redirect } from "next/navigation";
import { tableGroupHref } from "@/lib/table-qr";

export default async function TablePage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;
  const destination = tableGroupHref(tableId);
  if (!destination) notFound();
  redirect(destination);
}
