import { Menu, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import { FaTrophy, FaGlobe } from "react-icons/fa";
import { Link } from "react-router-dom";

interface RankingsDropdownProps {
  isCompact?: boolean;
}

export const RankingsDropdown: React.FC<RankingsDropdownProps> = ({
  isCompact = false,
}) => {

  const menuItems = [
    {
      label: "Global Rankings",
      icon: FaGlobe,
      to: "/rankings/global",
    },
    {
      label: "Performance Rankings",
      icon: FaTrophy,
      to: "/rankings/performance",
    },
  ];

  return (
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <Menu.Button
            className={`
              group relative flex items-center 
              ${isCompact ? "h-8 text-sm px-3" : "h-10 text-base px-4"}
              hover:bg-brand-400/10
              transition-all duration-200
            `}
          >
            {/* Content */}
            <div className="flex items-center">
              <span
                className={`
                  text-gray-200 group-hover:text-white
                  font-medium tracking-wide transition-all duration-200
                `}
              >
                Rankings
              </span>
              <svg
                className={`ml-1 h-4 w-4 ${
                  open ? "rotate-180 text-white" : "text-gray-400"
                } transition-transform duration-300`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </Menu.Button>

          <Transition
            show={open}
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left bg-dark-200/95 backdrop-blur-xl border border-brand-500/30 rounded-md shadow-lg overflow-hidden z-[100]">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5" />

              <div className="relative p-1">
                {menuItems.map((item) => (
                  <Menu.Item key={item.label}>
                    {({ active }) => (
                      <Link
                        to={item.to}
                        className={`
                          group flex items-center gap-2 px-4 py-2 text-sm transition-all duration-300 rounded-lg
                          ${
                            active
                              ? "bg-brand-500/20 text-white backdrop-blur-md"
                              : "text-gray-200 hover:text-white"
                          }
                        `}
                      >
                        <span
                          className={`
                            w-4 h-4 transition-colors duration-300
                            ${active ? "text-brand-200" : "text-brand-300"}
                          `}
                        >
                          <item.icon />
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
};
