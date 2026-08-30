import OrderReceived from "@/component/checkout/OrderReceived";

export const instant = false;

export default async function OrderReceivedPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { orderId } = await params;
  const { key } = await searchParams;

  return <OrderReceived orderId={orderId} orderKey={key || ""} />;
}
