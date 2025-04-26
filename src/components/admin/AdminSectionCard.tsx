import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface AdminSectionCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  link?: string;
  isSelected?: boolean;
  isNew?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const AdminSectionCard: React.FC<AdminSectionCardProps> = ({
  title,
  description,
  icon,
  color,
  link,
  isSelected = false,
  isNew = false,
  onClick,
  children
}) => {
  const cardContent = (
    <div className="flex items-start justify-between">
      <div>
        <div className={`text-3xl mb-3 text-${color}-300 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className={`text-lg font-bold text-${color}-200 mb-2 font-display tracking-wide`}>
          {title}
        </h3>
        <p className="text-gray-300 text-sm font-mono">
          {description}
        </p>
      </div>
      <div className={`text-${color}-300 text-lg ${
        link 
          ? 'opacity-0 group-hover:opacity-100 transition-opacity' 
          : `transform transition-all ${isSelected ? 'rotate-180' : ''}`
      }`}>
        {link ? '→' : '↓'}
      </div>
    </div>
  );

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`
        bg-dark-200/75 backdrop-blur-lg rounded-xl border-2
        ${
          isSelected
            ? `border-${color}-500/50 shadow-lg shadow-${color}-500/10`
            : `border-${color}-500/30 hover:border-${color}-500/50`
        }
        transition-all duration-300 group relative overflow-hidden
      `}
    >
      {/* Scanner line effect */}
      <div className="absolute inset-0 h-px w-full bg-gradient-to-r from-transparent via-brand-500/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      
      {/* New indicator */}
      {isNew && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="px-2 py-0.5 text-xs font-bold rounded-md bg-brand-500/30 text-brand-100 font-mono">
            NEW
          </div>
        </div>
      )}

      {/* Corner markers for cyberpunk feel */}
      <div className={`absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-${color}-500/40 transition-colors group-hover:border-${color}-500/70`}></div>
      <div className={`absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-${color}-500/40 transition-colors group-hover:border-${color}-500/70`}></div>
      
      {/* Card content rendering */}
      {link ? (
        <Link to={link} className="block p-6 h-full">
          {cardContent}
        </Link>
      ) : (
        <button
          onClick={onClick}
          className="block w-full p-6 text-left"
        >
          {cardContent}
        </button>
      )}
      
      {/* Expandable Content */}
      {isSelected && children && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-6 pb-6"
        >
          <div className={`pt-4 border-t border-${color}-500/20`}>
            {children}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminSectionCard;