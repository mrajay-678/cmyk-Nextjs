import { NextRequest, NextResponse } from "next/server";

const CART_TOKEN_COOKIE = "cmyk_cart_token";

type WooCartItem = {
  key: string;
};

type WooCart = {
  items?: WooCartItem[];
  items_count?: number;
};

type WooCartError = {
  data?: {
    cart?: WooCart;
  };
};

function copySessionHeaders(request: NextRequest) {
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const cartToken = request.headers.get("cart-token");
  const nonce = request.headers.get("nonce");

  if (cookie) {
    headers.set("Cookie", cookie);
  }

  if (cartToken) {
    headers.set("Cart-Token", cartToken);
  }

  if (nonce) {
    headers.set("Nonce", nonce);
  }

  return headers;
}

function updateSessionHeaders(headers: Headers, response: Response) {
  const cartToken = response.headers.get("cart-token");
  const nonce = response.headers.get("nonce");

  if (cartToken) {
    headers.set("Cart-Token", cartToken);
  }

  if (nonce) {
    headers.set("Nonce", nonce);
  }
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      code: "dev_clear_woo_cart_non_json",
      message: text.slice(0, 300),
    };
  }
}

async function storeFetch(
  request: NextRequest,
  path: string,
  init: RequestInit,
  sessionHeaders: Headers,
) {
  const url = new URL(`/api/store${path}`, request.url);
  const response = await fetch(url, {
    ...init,
    headers: sessionHeaders,
    cache: "no-store",
  });
  updateSessionHeaders(sessionHeaders, response);
  return response;
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const sessionHeaders = copySessionHeaders(request);
  const initialResponse = await storeFetch(
    request,
    "/cart",
    { method: "GET" },
    sessionHeaders,
  );
  const initialCart = (await readJsonResponse(initialResponse)) as WooCart | null;

  if (!initialResponse.ok || !initialCart) {
    return NextResponse.json(
      {
        code: "dev_clear_woo_cart_initial_fetch_failed",
        status: initialResponse.status,
        cart: initialCart,
      },
      { status: 502 },
    );
  }

  let nextCart = initialCart;

  for (let attempt = 0; attempt < 10 && nextCart.items?.length; attempt += 1) {
    const items = [...(nextCart.items || [])];

    for (const item of items) {
      if (!item.key) {
        continue;
      }

      const deleteResponse = await storeFetch(
        request,
        `/cart/items/${encodeURIComponent(item.key)}`,
        { method: "DELETE" },
        sessionHeaders,
      );

      const deleteBody = await readJsonResponse(deleteResponse);

      if (deleteResponse.ok) {
        nextCart = (deleteBody as WooCart | null) || nextCart;
        continue;
      }

      const errorCart = (deleteBody as WooCartError | null)?.data?.cart;
      if (deleteResponse.status === 409 && errorCart) {
        nextCart = errorCart;
        break;
      }

      return NextResponse.json(
        {
          code: "dev_clear_woo_cart_delete_failed",
          status: deleteResponse.status,
          key: item.key,
          body: deleteBody,
        },
        { status: 502 },
      );
    }
  }

  const finalResponse = await storeFetch(
    request,
    "/cart",
    { method: "GET" },
    sessionHeaders,
  );
  const finalCart = await readJsonResponse(finalResponse);

  if (!finalResponse.ok) {
    return NextResponse.json(
      {
        code: "dev_clear_woo_cart_final_fetch_failed",
        status: finalResponse.status,
        cart: finalCart,
      },
      { status: 502 },
    );
  }

  const response = NextResponse.json(finalCart || { items: [], items_count: 0 });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.cookies.set(CART_TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
  return response;
}
