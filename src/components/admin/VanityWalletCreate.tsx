import { Shield } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { admin } from "../../services/api/admin";
import { authService } from "../../services/AuthService";
import { useStore } from "../../store/useStore";

interface VanityWalletCreateProps {
  onSuccess?: () => void;
}

export const VanityWalletCreate: React.FC<VanityWalletCreateProps> = ({ onSuccess }) => {
  const { user } = useStore();
  const [pattern, setPattern] = useState("");
  const [isSuffix, setIsSuffix] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has super admin permissions
  const isSuperAdmin = authService.hasRole('superadmin');

  // Validation errors
  const [patternError, setPatternError] = useState<string | null>(null);

  // If user doesn't have super admin access, show access denied
  if (!isSuperAdmin) {
    return (
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-yellow-400" />
          <h3 className="text-md font-medium text-gray-100">Create Vanity Wallet</h3>
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
            Super Admin Only
          </span>
        </div>
        
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-yellow-400" />
            <h4 className="text-sm font-medium text-yellow-400">Access Restricted</h4>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            Creating vanity wallets requires Super Admin permissions.
          </p>
          <div className="text-xs text-gray-500">
            <div>Your role: <span className="text-gray-400">{user?.role || 'Unknown'}</span></div>
            <div>Required: <span className="text-yellow-400">superadmin</span></div>
          </div>
        </div>
      </div>
    );
  }

  const validatePattern = (value: string): boolean => {
    // Reset error
    setPatternError(null);
    
    // Check if pattern is provided
    if (!value.trim()) {
      setPatternError("Pattern is required");
      return false;
    }
    
    // Check length (1-10 characters)
    if (value.length > 10) {
      setPatternError("Pattern must be 10 characters or less");
      return false;
    }
    
    // Validate characters (Solana address compatible)
    // Valid characters are alphanumeric
    const validChars = /^[a-zA-Z0-9]+$/;
    if (!validChars.test(value)) {
      setPatternError("Pattern can only contain letters and numbers");
      return false;
    }
    
    return true;
  };

  const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPattern(value);
    validatePattern(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before submission
    if (!validatePattern(pattern)) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await admin.vanityWallets.create({
        pattern,
        isSuffix,
        caseSensitive,
      });
      
      toast.success(`Vanity wallet request for pattern '${pattern}' submitted successfully`);
      setPattern("");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to create vanity wallet:", error);
      
      // Handle 403 Forbidden specifically
      if (error instanceof Error && error.message.includes('403')) {
        setError("Access denied. Super admin permissions required.");
        toast.error("Access denied: Super admin permissions required");
      } else {
        setError("Failed to create vanity wallet. Please try again.");
        toast.error("Failed to create vanity wallet");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5 text-green-400" />
        <h3 className="text-md font-medium text-gray-100">Create Vanity Wallet</h3>
        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
          Super Admin Access ✓
        </span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pattern Input */}
        <div>
          <label htmlFor="pattern" className="block text-sm text-gray-400 mb-1">
            Pattern (1-10 characters)
          </label>
          <input
            id="pattern"
            type="text"
            value={pattern}
            onChange={handlePatternChange}
            placeholder="Enter pattern (e.g. DUEL)"
            className={`w-full bg-dark-400 border ${
              patternError ? "border-red-500" : "border-dark-300"
            } rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500`}
            disabled={isSubmitting}
          />
          {patternError && (
            <p className="mt-1 text-sm text-red-400">{patternError}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Only letters and numbers are allowed. Patterns are limited to characters that can appear in Solana addresses.
          </p>
        </div>
        
        {/* Display Format */}
        <div className="flex gap-2 items-center">
          <span className="text-gray-400 font-mono">Format:</span>
          <span className="text-brand-400 font-mono">
            {isSuffix ? `*${pattern || 'PATTERN'}` : `${pattern || 'PATTERN'}*`}
          </span>
          {caseSensitive && <span className="text-xs text-gray-400">(case sensitive)</span>}
        </div>
        
        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prefix/Suffix Toggle */}
          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <span className="text-sm text-gray-400 mr-3">Position:</span>
              <span className={`text-sm ${isSuffix ? "text-gray-400" : "text-gray-100"} mr-2`}>Prefix</span>
              <div className="relative">
                <input
                  type="checkbox"
                  value="isSuffix"
                  checked={isSuffix}
                  onChange={() => setIsSuffix(!isSuffix)}
                  className="sr-only peer"
                  disabled={isSubmitting}
                />
                <div className="w-11 h-6 bg-dark-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
              </div>
              <span className={`text-sm ${isSuffix ? "text-gray-100" : "text-gray-400"} ml-2`}>Suffix</span>
            </label>
          </div>
          
          {/* Case Sensitivity Toggle */}
          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <span className="text-sm text-gray-400 mr-3">Case Sensitivity:</span>
              <span className={`text-sm ${!caseSensitive ? "text-gray-100" : "text-gray-400"} mr-2`}>Insensitive</span>
              <div className="relative">
                <input
                  type="checkbox"
                  value="caseSensitive"
                  checked={caseSensitive}
                  onChange={() => setCaseSensitive(!caseSensitive)}
                  className="sr-only peer"
                  disabled={isSubmitting}
                />
                <div className="w-11 h-6 bg-dark-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
              </div>
              <span className={`text-sm ${caseSensitive ? "text-gray-100" : "text-gray-400"} ml-2`}>Sensitive</span>
            </label>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !pattern.trim()}
            className={`w-full px-4 py-2 rounded-lg ${
              isSubmitting || !pattern.trim()
                ? "bg-brand-500/50 cursor-not-allowed"
                : "bg-brand-500 hover:bg-brand-600"
            } text-white transition-colors flex justify-center items-center`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Submitting...
              </>
            ) : (
              "Create Vanity Wallet"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};