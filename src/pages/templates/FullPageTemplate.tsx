import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useStore } from "../../store/useStore";

interface FullPageTemplateProps {
  title: string;
  subtitle?: string;
  requiresAuth?: boolean;
}

export const FullPageTemplate: React.FC<FullPageTemplateProps> = ({ 
  title, 
  subtitle,
  requiresAuth = false 
}) => {
  const storeUser = useStore((state: any) => state.user);
  const { user: authUser, isAuthenticated } = useMigratedAuth();
  const user = authUser || storeUser;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Example data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Replace with your actual API call
        // const response = await fetch('/api/your-endpoint');
        // const result = await response.json();
        // setData(result);
        
        // Simulate loading
        setTimeout(() => {
          const exampleData = { example: "data" };
          setData(exampleData);
          console.log('Data loaded:', exampleData);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auth check
  if (requiresAuth && (!isAuthenticated || !user)) {
    return (
      <div className="flex flex-col min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative z-10 flex h-[50vh] items-center justify-center"
        >
          <div className="text-center relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream-responsive" />
            <h2 className="text-xl font-semibold text-gray-200 group-hover:animate-glitch">
              Connect Your Wallet
            </h2>
            <p className="mt-2 text-gray-400 group-hover:animate-cyber-pulse">
              Connect your wallet to access this page
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative z-10 container mx-auto px-4 py-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
            <p className="text-gray-400">Loading...</p>
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-800 rounded-lg p-6 h-32" />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative z-10 flex h-[50vh] items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Error Loading Page
            </h2>
            <p className="text-gray-400 mb-4">
              {error}
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main content
  return (
    <div className="flex flex-col min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative z-10 container mx-auto px-4 py-8"
      >
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-400 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* YOUR CONTENT GOES HERE */}
        <div className="space-y-8">
          {/* Replace this section with your actual content */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
            <h2 className="text-2xl font-bold text-white mb-4">Your Content Here</h2>
            <p className="text-gray-400">
              Replace this section with your page's content
            </p>
            {data && (
              <p className="text-gray-500 text-sm mt-2">
                Data loaded: {JSON.stringify(data)}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};