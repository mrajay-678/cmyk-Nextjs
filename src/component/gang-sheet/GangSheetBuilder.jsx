"use client";

import Script from "next/script";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

const DEFAULT_APP_HOST = "https://app.buildagangsheet.com";
const DEFAULT_WOO_HOST = "https://cmykprint.shop";
const DEFAULT_AJAX_PROXY_PATH = "/api/woocommerce/admin-ajax";
const DEFAULT_SHOP_UUID = "e28e4f98-a0b2-4b75-b1fd-e809863d91de";
const DEFAULT_SHOP_SLUG = "cmyk-print";

const sdkState = {
  externalReady: false,
  wooReady: false,
};
const initializedWooInstances = new Map();
let dtfCartNetworkDebugInstalled = false;

function debugGangStep(step, message, data = {}) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info(`[CMYK DTF Cart Debug ${step}] ${message}`, data);
}

function isDtfCartDebugUrl(value) {
  const url = typeof value === "string" ? value : value?.url || "";

  return (
    url.includes("/api/woocommerce/admin-ajax") ||
    url.includes("/wp-admin/admin-ajax.php")
  );
}

function getFetchBodyDebug(init) {
  const body = init?.body;

  if (!body) {
    return { bodyType: "none", bodyKeys: [] };
  }

  if (body instanceof FormData) {
    return {
      bodyType: "FormData",
      bodyAction: String(body.get("action") || "none"),
      bodyProductId: String(
        body.get("product_id") || body.get("add-to-cart") || "none",
      ),
      bodyVariationId: String(body.get("variation_id") || "none"),
      bodyKeys: Array.from(body.keys()),
    };
  }

  if (body instanceof URLSearchParams) {
    return {
      bodyType: "URLSearchParams",
      bodyAction: body.get("action") || "none",
      bodyProductId:
        body.get("product_id") || body.get("add-to-cart") || "none",
      bodyVariationId: body.get("variation_id") || "none",
      bodyKeys: Array.from(body.keys()),
    };
  }

  if (typeof body === "string") {
    const params = new URLSearchParams(body);

    return {
      bodyType: "string",
      bodyAction: params.get("action") || "none",
      bodyProductId:
        params.get("product_id") || params.get("add-to-cart") || "none",
      bodyVariationId: params.get("variation_id") || "none",
      bodyKeys: Array.from(params.keys()),
    };
  }

  return {
    bodyType: body.constructor?.name || "unknown",
    bodyKeys: [],
  };
}

function installDtfCartNetworkDebug() {
  if (
    process.env.NODE_ENV !== "development" ||
    typeof window === "undefined" ||
    dtfCartNetworkDebugInstalled
  ) {
    return;
  }

  dtfCartNetworkDebugInstalled = true;

  const originalFetch = window.fetch?.bind(window);
  if (originalFetch) {
    window.fetch = async (...args) => {
      const requestUrl = String(args[0]?.url || args[0] || "");
      const shouldLog = isDtfCartDebugUrl(requestUrl);
      const requestDebug = getFetchBodyDebug(args[1]);

      if (shouldLog) {
        debugGangStep("02A", "BAGS ajax request started", {
          transport: "fetch",
          url: requestUrl,
          method: args[1]?.method || args[0]?.method || "GET",
          ...requestDebug,
        });
      }

      const response = await originalFetch(...args);

      if (shouldLog) {
        const responseDebug = {
          transport: "fetch",
          status: response.status,
          redirected: response.redirected,
          responseUrl: response.url,
          requestUrl,
        };

        try {
          window.sessionStorage.setItem(
            "cmyk_dtf_cart_last_ajax_debug",
            JSON.stringify({
              ...responseDebug,
              savedAt: new Date().toISOString(),
            }),
          );
        } catch {
          // Debug storage is best-effort only.
        }
        debugGangStep("02B", "BAGS ajax response received", responseDebug);
      }

      return response;
    };
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function open(method, url, ...rest) {
    this.__cmykDtfCartDebug = {
      method,
      url: String(url || ""),
      shouldLog: isDtfCartDebugUrl(String(url || "")),
    };

    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function send(...args) {
    const debug = this.__cmykDtfCartDebug;

    if (debug?.shouldLog) {
      debugGangStep("02A", "BAGS ajax request started", {
        transport: "xhr",
        method: debug.method,
        url: debug.url,
      });

      this.addEventListener(
        "loadend",
        () => {
          const responseDebug = {
            transport: "xhr",
            method: debug.method,
            url: debug.url,
            status: this.status,
            responseUrl: this.responseURL,
          };

          try {
            window.sessionStorage.setItem(
              "cmyk_dtf_cart_last_ajax_debug",
              JSON.stringify({
                ...responseDebug,
                savedAt: new Date().toISOString(),
              }),
            );
          } catch {
            // Debug storage is best-effort only.
          }

          debugGangStep("02B", "BAGS ajax response received", {
            ...responseDebug,
          });
        },
        { once: true },
      );
    }

    return originalSend.apply(this, args);
  };
}

function normalizeInstanceId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "-");
}

function normalizeExternalSizes(sizes = []) {
  return sizes.map((size) => ({
    id: size.id,
    width: Number(size.width),
    height: Number(size.height),
    unit: size.unit || "in",
    title: size.title || size.label,
    price: size.price,
    metadata: size.metadata,
    visible: size.visible,
  }));
}

function ensureWooGlobals({ ajaxUrl, cartUrl }) {
  window.appEnv = window.appEnv || "production";
  window.wc_add_to_cart_params = {
    ...(window.wc_add_to_cart_params || {}),
    ajax_url: ajaxUrl,
    wc_ajax_url: "/?wc-ajax=%%endpoint%%",
    cart_url: cartUrl,
    cart_redirect_after_add: "no",
  };
}

function ensureStylesheet(id, href) {
  if (document.getElementById(id)) {
    return;
  }

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function ensureWooStyles(version, appHost, productType) {
  const productCssId = `bags-product-css-${version}`;
  ensureStylesheet(
    productCssId,
    `${appHost}/assets/woo/css/gang-sheet-product.css?v=${version}`,
  );

  if (Number(productType) === 7) {
    ensureStylesheet(
      `bags-size-css-${version}`,
      `${appHost}/assets/woo/css/gang-size.css?v=${version}`,
    );
  }
}

function WooStyles({ appHost, version, productType }) {
  const productCssId = `bags-product-css-${version}`;
  const sizeCssId = `bags-size-css-${version}`;

  return (
    <>
      <link
        id={productCssId}
        rel="stylesheet"
        href={`${appHost}/assets/woo/css/gang-sheet-product.css?v=${version}`}
      />
      {Number(productType) === 7 ? (
        <link
          id={sizeCssId}
          rel="stylesheet"
          href={`${appHost}/assets/woo/css/gang-size.css?v=${version}`}
        />
      ) : null}
    </>
  );
}
export default function GangSheetBuilder({
  mode = "external",
  productId,
  productType = "1",
  shopUuid = DEFAULT_SHOP_UUID,
  shopSlug = DEFAULT_SHOP_SLUG,
  appHost = DEFAULT_APP_HOST,
  wooHost = DEFAULT_WOO_HOST,
  sdkVersion = "1.9.12",
  label = "Build Your Own Gang Sheet",
  buttonClassName = "",
  buttonStyle,
  disabled = false,
  sizes = [],
  sizeId,
  quantity = 1,
  variants = [],
  customer = {},
  cartUrl = `${DEFAULT_WOO_HOST}/cart/`,
  ajaxUrl,
  externalSettings,
  onReady,
  onOpen,
  onClose,
  onError,
  onDesignCreated,
  onDesignUpdated,
  children,
}) {
  const reactId = useId();
  const instanceId = useMemo(
    () => normalizeInstanceId(`gang-sheet-${productId || mode}-${reactId}`),
    [mode, productId, reactId],
  );
  const [scriptReady, setScriptReady] = useState(
    mode === "external" ? sdkState.externalReady : sdkState.wooReady,
  );
  const [wooClickLocked, setWooClickLocked] = useState(false);
  const wooButtonRef = useRef(null);
  const wooClickLockedRef = useRef(false);
  const resolvedAjaxUrl = ajaxUrl || DEFAULT_AJAX_PROXY_PATH;
  const resolvedCartUrl = cartUrl || `${wooHost}/cart/`;

  const wooOptions = useMemo(
    () => ({
      shop_uuid: shopUuid,
      shop_slug: shopSlug,
      gs_version: sdkVersion,
      product_id: String(productId || ""),
      product_type: String(productType),
      quantity,
      variants,
      cart_url: resolvedCartUrl,
      customer,
      btn_label: label,
      btn_bg_color: "#000000",
      btn_fg_color: "#ffffff",
      instance_id: instanceId,
    }),
    [
      customer,
      instanceId,
      label,
      productId,
      productType,
      quantity,
      resolvedCartUrl,
      sdkVersion,
      shopSlug,
      shopUuid,
      variants,
    ],
  );

  const initializeWooShortcode = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const optionsSignature = JSON.stringify(wooOptions);
    if (initializedWooInstances.get(instanceId) === optionsSignature) {
      return;
    }

    ensureWooGlobals({ ajaxUrl: resolvedAjaxUrl, cartUrl: resolvedCartUrl });
    ensureWooStyles(sdkVersion, appHost, productType);
    window.GangSheetShortcodeOptions = window.GangSheetShortcodeOptions || {};
    window.GangSheetShortcodeOptions[instanceId] = wooOptions;
    initializedWooInstances.set(instanceId, optionsSignature);

    if (typeof window.initializeGangSheetShortcodes === "function") {
      window.initializeGangSheetShortcodes();
    }
  }, [
    appHost,
    instanceId,
    productType,
    resolvedAjaxUrl,
    resolvedCartUrl,
    sdkVersion,
    wooOptions,
  ]);

  useEffect(() => {
    return () => {
      initializedWooInstances.delete(instanceId);
      if (typeof window !== "undefined" && window.GangSheetShortcodeOptions) {
        delete window.GangSheetShortcodeOptions[instanceId];
      }
    };
  }, [instanceId]);

  useEffect(() => {
    if (mode !== "woo-product") {
      return undefined;
    }

    installDtfCartNetworkDebug();

    const button = wooButtonRef.current;
    if (!button) {
      return undefined;
    }

    let unlockTimer = null;

    function handleWooButtonClick(event) {
      if (disabled || !scriptReady || wooClickLockedRef.current) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Keep our duplicate-click guard separate from the BAGS SDK's onclick hook.
      wooClickLockedRef.current = true;
      setWooClickLocked(true);
      unlockTimer = window.setTimeout(() => {
        wooClickLockedRef.current = false;
        setWooClickLocked(false);
      }, 1500);

      debugGangStep("01", "builder button clicked", {
        productId,
        productType,
        cartUrl: resolvedCartUrl,
      });
      onOpen?.();
    }

    button.addEventListener("click", handleWooButtonClick, true);

    return () => {
      button.removeEventListener("click", handleWooButtonClick, true);
      if (unlockTimer) {
        window.clearTimeout(unlockTimer);
      }
    };
  }, [
    disabled,
    mode,
    onOpen,
    productId,
    productType,
    resolvedCartUrl,
    scriptReady,
  ]);

  const openExternalBuilder = useCallback(() => {
    if (disabled) {
      return;
    }

    if (typeof window === "undefined" || !window.gs_builder) {
      onError?.({
        reason: "Builder script not loaded. Please wait and try again.",
      });
      return;
    }

    const sdkSizes = normalizeExternalSizes(sizes);
    if (!shopUuid || !sdkSizes.length) {
      onError?.({
        reason: "Gang Sheet Builder requires a shop ID and at least one size.",
      });
      return;
    }

    onOpen?.();

    window.gs_builder
      .open({
        mode: "production",
        shop_id: shopUuid,
        size_id: sizeId || sdkSizes[0].id,
        quantity,
        sizes: sdkSizes,
        settings: externalSettings,
      })
      .on("design:created", (event) => onDesignCreated?.(event))
      .on("design:updated", (event) => onDesignUpdated?.(event))
      .on("closed", (event) => onClose?.(event))
      .on("error", (event) => onError?.(event));
  }, [
    disabled,
    externalSettings,
    onClose,
    onDesignCreated,
    onDesignUpdated,
    onError,
    onOpen,
    quantity,
    shopUuid,
    sizeId,
    sizes,
  ]);

  if (mode === "woo-product") {
    return (
      <>
        <WooStyles
          appHost={appHost}
          version={sdkVersion}
          productType={productType}
        />
        <Script
          id={`bags-woo-sdk-${sdkVersion}`}
          src={`${appHost}/assets/woo/scripts/gang-sheet-product.js?v=${sdkVersion}`}
          strategy="afterInteractive"
          onLoad={() => {
            sdkState.wooReady = true;
            setScriptReady(true);
            initializeWooShortcode();
            onReady?.();
          }}
          onReady={() => {
            sdkState.wooReady = true;
            setScriptReady(true);
            initializeWooShortcode();
            onReady?.();
          }}
          onError={() =>
            onError?.({ reason: "Failed to load Build a Gang Sheet Woo SDK." })
          }
        />
        <div data-gs-instance-id={instanceId}>
          <button
            ref={wooButtonRef}
            type="button"
            className={`gang-sheet-shortcode-button ${buttonClassName}`}
            style={buttonStyle}
            disabled={disabled || !scriptReady || wooClickLocked}
          >
            {children || label}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Script
        id="bags-external-builder-sdk"
        src={`${appHost}/assets/v1/scripts/gs-builder.min.js`}
        strategy="afterInteractive"
        onLoad={() => {
          sdkState.externalReady = true;
          setScriptReady(true);
          onReady?.();
        }}
        onReady={() => {
          sdkState.externalReady = true;
          setScriptReady(true);
          onReady?.();
        }}
        onError={() =>
          onError?.({ reason: "Failed to load Gang Sheet Builder SDK." })
        }
      />
      <button
        type="button"
        className={buttonClassName}
        style={buttonStyle}
        onClick={openExternalBuilder}
        disabled={disabled || !scriptReady}
      >
        {children || label}
      </button>
    </>
  );
}
