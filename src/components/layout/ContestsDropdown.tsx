import { Menu, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import { FaTrophy, FaChartPie, FaList } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useStore } from "../../store/useStore";

interface ContestsDropdownProps {
  isCompact?: boolean;
}

export const ContestsDropdown: React.FC<ContestsDropdownProps> = ({
  isCompact = false,
}) => {
  // Use direct store access for user authentication status
  const { user } = useStore();
  
  const buttonStyles = {
    bg: "from-brand-500/20 to-brand-400/20",
    text: "text-gray-200",
    border: "border-brand-400/20",
    hover: {
      bg: "group-hover:from-brand-400/25 group-hover:to-brand-300/25",
      text: "group-hover:text-white",
      border: "group-hover:border-brand-400/30",
      glow: "group-hover:shadow-[0_0_8px_rgba(153,51,255,0.15)]",
    },
    ring: "ring-brand-400/20 group-hover:ring-brand-400/30",
    shine: "via-white/20",
  };

  interface MenuItem {
    label: string;
    icon: React.ComponentType;
    to: string;
    protected?: boolean;
  }
  
  const menuItems: MenuItem[] = [
    {
      label: "Browse Contests",
      icon: FaList,
      to: "/contests",
    },
  ];
  
  // Add authenticated-only menu items
  // Simply check if user exists to determine authentication status
  console.log("[DEBUG] Current user:", user);
  
  // Always add these items to the menu - we'll check authentication when rendering
  menuItems.push(
    {
      label: "My Contests",
      icon: FaTrophy,
      to: "/my-contests",
      protected: true
    },
    {
      label: "My Portfolios",
      icon: FaChartPie,
      to: "/my-portfolios",
      protected: true
    }
  );

  return (
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <Menu.Button
            className={`
              relative group overflow-hidden transition-all duration-300 ease-out
              ${isCompact ? "h-7 text-sm" : "h-8 text-base"} flex items-center px-3
              rounded-full backdrop-blur-lg border-[0.5px] ${buttonStyles.border} ${
              buttonStyles.hover.border
            }
              ${buttonStyles.hover.glow} transition-shadow duration-500
            `}
          >
            {/* Background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${buttonStyles.bg} ${buttonStyles.hover.bg} transition-all duration-300 opacity-80`}
            />

            {/* Shine effect */}
            <div className="absolute inset-0">
              <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent ${buttonStyles.shine} to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000`}
              />
            </div>

            {/* Content */}
            <div className="relative flex items-center w-full">
              <span
                className={`
                  ${buttonStyles.text} ${buttonStyles.hover.text}
                  font-medium tracking-wide transition-all duration-300
                `}
              >
                Contests
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
            <Menu.Items className="absolute left-0 mt-1 w-48 origin-top-left bg-dark-200/80 backdrop-blur-xl border-[0.5px] border-brand-500/30 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative p-1">
                {menuItems.map((item) => {
                  // Skip protected items if user is not authenticated
                  // Only check if user exists, not wallet connection status
                  if (item.protected && !user) {
                    return null;
                  }
                  
                  return (
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
                          <span className={`
                              w-4 h-4 transition-colors duration-300
                              ${active ? "text-brand-200" : "text-brand-300"}
                            `}>
                            <item.icon />
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </Menu.Item>
                  );
                })}
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
};