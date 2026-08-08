import React from "react";
import Image from "next/image";
import Menu from "./Menu";
import CartButton from "./CartButton";

const Header = () => {
  return (
    <header className="sticky top-0 z-40  items-center justify-between gap-4 bg-white px-2 py-3 text-xl md:px-0 lg:py-0">
      <div className="mx-auto flex w-full max-w-[95vw]">
        <div className="flex flex-1 items-center">
          <Menu />
        </div>
        <div className="flex flex-1 items-center justify-center lg:justify-between">
          <div className="relative h-16 w-28 sm:h-20 sm:w-32 lg:h-24 lg:w-36">
            <Image
              src="https://cmykprint.shop/wp-content/uploads/2025/11/cropped-logocymk-1.webp"
              fill
              className="object-contain"
              alt="CMYK Print Shop"
            />
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
