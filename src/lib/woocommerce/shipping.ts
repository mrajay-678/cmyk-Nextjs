import { storeApiFetch } from "./store-api";
import type { WooCart } from "./types";

export function selectShippingRate(rateId: string, packageId?: string | number | null) {
  return storeApiFetch<WooCart>("/cart/select-shipping-rate", {
    method: "POST",
    json: {
      rate_id: rateId,
      package_id: packageId ?? null,
    },
  });
}
