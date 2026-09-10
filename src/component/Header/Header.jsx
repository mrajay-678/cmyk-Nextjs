import React from "react";
import Image from "next/image";
import Menu from "./Menu";
import CartButton from "./CartButton";
import Link from "next/link";
import { fallbackProductMenu, getMenu } from "@/data/menu";
import { getProductMenuItems } from "@/component/product/wooCommerce";

const Header = async () => {
  const productMenu = await getProductMenuItems();
  const menuItems = getMenu(productMenu.length ? productMenu : fallbackProductMenu);

  return (
    <header className="sticky top-0 z-40  items-center justify-between gap-4 bg-white px-2 py-3 text-xl md:px-0 lg:py-0">
      <div className="mx-auto flex w-full header-container">
        <div className="flex flex-1 items-center">
          <Menu items={menuItems} />
        </div>
        <div className="flex flex-1 items-center justify-between ">
          <div className="relative h-16 w-28 sm:h-20 sm:w-32 lg:h-24 lg:w-36 translate-x-[-50%]">
            <Link href={"./"}>
              <Image
                src="https://wp.cmykprint.shop/wp-content/uploads/2025/11/cropped-logocymk-1.webp"
                fill
                className="object-contain"
                alt="CMYK Print Shop"
              />
            </Link>
          </div>
          <div className="hidden lg:block">
            <CartButton />
          </div>
        </div>
        <div className="flex flex-1 justify-end lg:hidden">
          <CartButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
