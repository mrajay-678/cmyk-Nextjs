function categoryLink(slug) {
  return `/products?category=${slug}`;
}

function tagLink(slug) {
  return `/products?tag=${slug}`;
}

export const menu = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "DTF Transfer",
    href: "/products?category=dtf-transfer&sort=date-desc",
    children: [
      {
        title: "DTF By Size",
        href: "/products/dtf-by-size",
      },
      {
        title: "DTF Gang Sheet",
        href: "/products/dtf-gang-sheet",
      },
      {
        title: "DTF Gang Sheet Builder",
        href: "/products/dtf-gang-sheet-builder",
      },
    ],
  },
  {
    title: "UV DTF Stickers",
    href: "/products?category=uv-dtf-transfer&sort=date-desc",
    children: [
      {
        title: "UV DTF By Size",
        href: "/products/uv-dtf-by-size",
      },
      {
        title: "UV DTF Gang Sheet",
        href: "/products/uv-dtf-gang-sheet",
      },
      {
        title: "UV DTF Gang Sheet Builder",
        href: "/products/uv-dtf-gang-sheet-builder",
      },
    ],
  },
  {
    title: "Products",
    href: "/products",
    children: [
      {
        title: "Apparel",
        href: categoryLink("apparel"),
        children: [
          { title: "T-shirts", href: tagLink("t-shirts") },
          { title: "Polos", href: tagLink("polos") },
          { title: "Shirts", href: tagLink("shirts") },
          { title: "Hoodies", href: tagLink("hoodies") },
          { title: "Sweatpants", href: tagLink("sweatpants") },
          { title: "Shorts", href: tagLink("shorts") },
          { title: "Caps", href: tagLink("caps") },
          { title: "Safety Vests", href: tagLink("safety-vests") },
        ],
      },
      {
        title: "Drinkware",
        href: categoryLink("drinkware"),
        children: [
          { title: "Bottles", href: tagLink("bottles") },
          { title: "Mugs", href: tagLink("mugs") },
          { title: "Glasses", href: tagLink("glasses") },
          { title: "Coasters", href: tagLink("coasters") },
        ],
      },
      {
        title: "Labels",
        href: categoryLink("labels"),
        children: [
          { title: "Stickers / Decals", href: tagLink("stickers-decals") },
        ],
      },
      {
        title: "Marketing Material",
        href: categoryLink("marketing-material"),
        children: [
          { title: "Magnets", href: tagLink("magnets") },
          { title: "Buttons", href: tagLink("buttons") },
          { title: "Lanyards", href: tagLink("lanyards") },
          { title: "Booklets", href: tagLink("booklets") },
          { title: "Brochures", href: tagLink("brochures") },
          { title: "Flyers", href: tagLink("flyers") },
          { title: "Mylar Bags", href: tagLink("mylar-bags") },
        ],
      },
      {
        title: "Stationery",
        href: categoryLink("stationery"),
        children: [
          { title: "Business Cards", href: tagLink("business-cards") },
          { title: "Letterheads", href: tagLink("letterheads") },
          { title: "Envelopes", href: tagLink("envelopes") },
          { title: "Pens", href: tagLink("pens") },
          { title: "Writing Pads", href: tagLink("writing-pads") },
        ],
      },
    ],
  },
  {
    title: "Support",
    href: "/pressing-instructions",
    children: [
      {
        title: "Pressing Instructions",
        href: "/pressing-instructions",
      },
      {
        title: "FAQs",
        href: "/faqs",
      },
      {
        title: "Contact Us",
        href: "/contact",
      },
    ],
  },
];
