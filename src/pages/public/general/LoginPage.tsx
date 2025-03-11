import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
// @ts-ignore - JSX component without TypeScript definitions
import LoginOptions from '../../../components/auth/LoginOptions';
import Logo from '../../../components/ui/Logo';
import { useAuthContext } from '../../../contexts/AuthContext';

/**
 * Dedicated login page for DegenDuel
 * Displays all available login options and serves as a fallback route
 */
const LoginPage: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  
  // If already logged in, redirect to home
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-10"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <Logo size="lg" animated={true} />
        </div>
        
        {/* Login options panel */}
        <LoginOptions />
        
        {/* Note below login panel */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center text-sm text-gray-400 mt-4"
        >
          New to DegenDuel? Simply connect your wallet to create an account!
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;