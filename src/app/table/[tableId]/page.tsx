import { TableRoutingView } from "./TableRoutingView";

export default async function TablePage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;
  const decodedId = decodeURIComponent(tableId);

  return (
    <main id="main" className="site-width min-h-[80vh] flex flex-col justify-center">
      <TableRoutingView tableId={decodedId} />
    </main>
  );
}
