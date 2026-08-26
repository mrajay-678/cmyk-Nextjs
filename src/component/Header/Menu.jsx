"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Menu as MenuIcon, X } from "lucide-react";
import { menu } from "@/data/menu";
export default function Menu() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsMobileOpen(open => !open)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-900 transition hover:bg-neutral-50 lg:hidden"
        aria-label="Toggle navigation"
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
      </button>

      <nav className="hidden gap-8 text-sm font-medium lg:flex">
        {menu.map(item => (
          <div
            key={item.title}
            className="relative"
            onMouseEnter={() => setActiveMenu(item)}
            onMouseLeave={() => {
              setActiveMenu(null);
              setActiveSubMenu(null);
            }}
          >
            <Link
              href={item.href || "#"}
              className="hover:text-pink-500 pb-1 border-b-2 text-body-color border-transparent hover:border-pink-500"
            >
              {item.title}
            </Link>

            {/* DROPDOWN */}
            {activeMenu?.title === item.title && item.children && (
              <div
                className="absolute left-0 top-full z-50 flex gap-4 pt-4"
                onMouseEnter={() => setActiveMenu(item)}
                onMouseLeave={() => {
                  setActiveMenu(null);
                  setActiveSubMenu(null);
                }}
              >
                {/* FIRST PANEL */}
                <div className="w-64 rounded-2xl bg-black p-6 text-white shadow-xl">
                  {item.children.map(child => (
                    <div
                      key={child.title}
                      onMouseEnter={() => setActiveSubMenu(child)}
                      className="flex cursor-pointer items-center justify-between py-2 hover:text-gray-300"
                    >
                      {child.href ? (
                        <Link
                          href={child.href}
                          className="flex flex-1 items-center justify-between"
                        >
                          <span>{child.title}</span>
                          {child.children && <ChevronRight size={16} />}
                        </Link>
                      ) : (
                        <>
                          <span>{child.title}</span>
                          {child.children && <ChevronRight size={16} />}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* SECOND PANEL */}
                {activeSubMenu?.children && (
                  <div
                    className="w-64 rounded-2xl bg-black p-6 text-white shadow-xl"
                    onMouseEnter={() => setActiveSubMenu(activeSubMenu)}
                  >
                    {activeSubMenu.children.map(sub => (
                      <Link
                        key={sub.title}
                        href={sub.href || "#"}
                        className="block py-2 hover:text-gray-300"
                      >
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      {isMobileOpen ? (
        <div className="absolute left-0 top-14 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-neutral-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.18)] lg:hidden">
          <nav className="space-y-1">
            {menu.map(item => {
              const isActive = activeMenu?.title === item.title;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={item.href || "#"}
                      onClick={() => !item.children && setIsMobileOpen(false)}
                      className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                    >
                      {item.title}
                    </Link>
                    {item.children ? (
                      <button
                        type="button"
                        onClick={() => setActiveMenu(isActive ? null : item)}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-50"
                        aria-label={`Toggle ${item.title} submenu`}
                      >
                        <ChevronDown
                          size={18}
                          className={`transition ${isActive ? "rotate-180" : ""}`}
                        />
                      </button>
                    ) : null}
                  </div>

                  {isActive && item.children ? (
                    <div className="ml-3 border-l border-neutral-200 pl-3">
                      {item.children.map(child => (
                        <Link
                          key={child.title}
                          href={child.href || "#"}
                          onClick={() => setIsMobileOpen(false)}
                          className="block rounded-xl px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50 hover:text-pink-500"
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
