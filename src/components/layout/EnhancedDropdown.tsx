// src/components/layout/EnhancedDropdown.tsx
import { Menu, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export interface DropdownMenuItem {
  label: string;
  icon?: React.ComponentType;
  to: string;
  protected?: boolean;
}

interface EnhancedDropdownProps {
  label: string;
  items: DropdownMenuItem[];
  isCompact?: boolean;
  isAuthenticated?: boolean;
  colorScheme?: "brand" | "cyber" | "success";
}

export const EnhancedDropdown: React.FC<EnhancedDropdownProps> = ({
  label,
  items,
  isCompact = false,
  isAuthenticated = false,
  colorScheme = "brand",
}) => {
  // Color variants based on the scheme
  const colorVariants = {
    brand: {
      hoverBg: "hover:bg-brand-400/10",
      border: "border-brand-400/20",
      menuBorder: "border-brand-500/30",
      activeBg: "bg-brand-500/20",
      iconActive: "text-brand-200",
      iconInactive: "text-brand-300",
      glowFrom: "from-brand-400/5",
      glowTo: "to-brand-600/5",
      menuDivider: "from-transparent via-brand-500/30 to-transparent",
      menuShadow: "shadow-brand-500/20",
      hoverShadow: "hover:shadow-brand-500/20",
      pulseColor: "rgba(153, 51, 255, 0.2)",
      menuItemShadow: "group-hover:shadow-[0_0_8px_rgba(153,51,255,0.3)]"
    },
    cyber: {
      hoverBg: "hover:bg-cyber-400/10",
      border: "border-cyber-400/20",
      menuBorder: "border-cyber-500/30",
      activeBg: "bg-cyber-500/20",
      iconActive: "text-cyber-200",
      iconInactive: "text-cyber-300",
      glowFrom: "from-cyber-400/5",
      glowTo: "to-cyber-600/5",
      menuDivider: "from-transparent via-cyber-500/30 to-transparent",
      menuShadow: "shadow-cyber-500/20",
      hoverShadow: "hover:shadow-cyber-500/20",
      pulseColor: "rgba(0, 225, 255, 0.2)",
      menuItemShadow: "group-hover:shadow-[0_0_8px_rgba(0,225,255,0.3)]"
    },
    success: {
      hoverBg: "hover:bg-green-400/10",
      border: "border-green-400/20",
      menuBorder: "border-green-500/30",
      activeBg: "bg-green-500/20",
      iconActive: "text-green-300",
      iconInactive: "text-green-400",
      glowFrom: "from-green-400/5",
      glowTo: "to-green-600/5",
      menuDivider: "from-transparent via-green-500/30 to-transparent",
      menuShadow: "shadow-green-500/20",
      hoverShadow: "hover:shadow-green-500/20",
      pulseColor: "rgba(34, 197, 94, 0.2)",
      menuItemShadow: "group-hover:shadow-[0_0_8px_rgba(34,197,94,0.3)]"
    }
  };

  // Get the current variant
  const colors = colorVariants[colorScheme];

  return (
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <Menu.Button
            className={`
              group relative flex items-center 
              ${isCompact ? "h-8 text-sm px-3" : "h-10 text-base px-4"}
              ${colors.hoverBg} border-r ${colors.border}
              transition-all duration-300 ease-out
              ${open ? colors.activeBg : ""}
              hover:scale-[1.02] active:scale-[0.98]
            `}
          >
            {/* Animated glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 rounded-sm animate-pulse" 
                style={{ 
                  boxShadow: `0 0 8px ${colors.pulseColor}`,
                  opacity: 0.5 
                }}
              />
            </div>

            {/* Content */}
            <div className="flex items-center relative z-10">
              <span
                className={`
                  text-gray-200 group-hover:text-white
                  font-medium tracking-wide transition-all duration-200
                  ${open ? "text-white" : ""}
                `}
              >
                {label}
              </span>
              
              {/* Animated arrow with smoother transition */}
              <motion.div
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                className="ml-1.5"
              >
                <svg
                  className={`h-4 w-4 ${
                    open ? "text-white" : "text-gray-400 group-hover:text-gray-200"
                  } transition-colors duration-300`}
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
              </motion.div>
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
            <Menu.Items 
              className={`
                absolute left-0 mt-2 w-56 origin-top-left 
                bg-dark-200/95 backdrop-blur-xl 
                border ${colors.menuBorder} rounded-md 
                shadow-lg overflow-hidden z-50
                ${colors.menuShadow}
              `}
            >
              {/* Enhanced background effects */}
              <div className={`absolute inset-0 bg-gradient-to-br ${colors.glowFrom} via-transparent ${colors.glowTo} opacity-80`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,20,30,0.5),transparent_70%)]" />
              
              {/* Animated shine effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100" 
                style={{
                  animation: 'shine 3s ease-in-out infinite',
                  backgroundSize: '200% 100%',
                  backgroundPositionX: '-100%'
                }}
              />

              <div className="relative p-1.5">
                {items
                  .filter(item => !item.protected || isAuthenticated)
                  .map((item) => (
                    <Menu.Item key={item.label}>
                      {({ active }) => (
                        <Link
                          to={item.to}
                          className={`
                            group flex items-center gap-3 px-4 py-2.5 text-sm 
                            transition-all duration-300 rounded-lg
                            ${active ? `${colors.activeBg} text-white backdrop-blur-md shadow-sm ${colors.menuItemShadow}` : "text-gray-200 hover:text-white"}
                            relative overflow-hidden transform hover:-translate-y-0.5
                          `}
                        >
                          {/* Icon with enhanced styling */}
                          {item.icon && (
                            <span
                              className={`
                                w-5 h-5 flex items-center justify-center transition-all duration-300
                                ${active ? colors.iconActive : colors.iconInactive}
                                group-hover:scale-110
                              `}
                            >
                              <item.icon />
                            </span>
                          )}
                          
                          {/* Label with subtle hover effects */}
                          <span className="relative transform transition-transform duration-300">
                            {item.label}
                            
                            {/* Underline animation on hover */}
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-white/0 via-white/60 to-white/0 group-hover:w-full transition-all duration-300" />
                          </span>
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

// Note: Animations are defined in src/styles/utilities.css to keep the code clean

export default EnhancedDropdown;