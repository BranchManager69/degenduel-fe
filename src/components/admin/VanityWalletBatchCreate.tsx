import { Shield } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { admin } from "../../services/api/admin";
import { authService } from "../../services/AuthService";
import { useStore } from "../../store/useStore";
import { VanityWalletBatchCreateResponse } from "../../types";

interface VanityWalletBatchCreateProps {
  onSuccess?: () => void;
}

export const VanityWalletBatchCreate: React.FC<VanityWalletBatchCreateProps> = ({ onSuccess }) => {
  const { user } = useStore();
  const [patternsText, setPatternsText] = useState("");
  const [patterns, setPatterns] = useState<string[]>([]);
  const [isSuffix, setIsSuffix] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResults, setSubmissionResults] = useState<VanityWalletBatchCreateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patternErrors, setPatternErrors] = useState<string[]>([]);

  // Check if user has super admin permissions
  const isSuperAdmin = authService.hasRole('superadmin');

  // If user doesn't have super admin access, show access denied
  if (!isSuperAdmin) {
    return (
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-yellow-400" />
          <h3 className="text-md font-medium text-gray-100">Batch Create Vanity Wallets</h3>
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
            Batch creating vanity wallets requires Super Admin permissions.
          </p>
          <div className="text-xs text-gray-500">
            <div>Your role: <span className="text-gray-400">{user?.role || 'Unknown'}</span></div>
            <div>Required: <span className="text-yellow-400">superadmin</span></div>
          </div>
        </div>
      </div>
    );
  }

  // Process patterns text into an array of patterns
  useEffect(() => {
    const processed = patternsText
      .split("\n")
      .map(p => p.trim())
      .filter(p => p !== "");
    setPatterns(processed);
    
    // Validate patterns
    validatePatterns(processed);
  }, [patternsText]);

  const validatePatterns = (patternsList: string[]): boolean => {
    const errors: string[] = [];
    
    // Check if any patterns exist
    if (patternsList.length === 0) {
      errors.push("At least one pattern is required");
      setPatternErrors(errors);
      return false;
    }
    
    // Validate each pattern
    for (let i = 0; i < patternsList.length; i++) {
      const pattern = patternsList[i];
      
      // Check length (1-10 characters)
      if (pattern.length > 10) {
        errors.push(`Line ${i + 1}: Pattern must be 10 characters or less`);
      }
      
      // Validate characters (Solana address compatible)
      const validChars = /^[a-zA-Z0-9]+$/;
      if (!validChars.test(pattern)) {
        errors.push(`Line ${i + 1}: Pattern can only contain letters and numbers`);
      }
    }
    
    setPatternErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before submission
    if (!validatePatterns(patterns)) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSubmissionResults(null);
    
    try {
      const response = await admin.vanityWallets.batchCreate({
        patterns,
        isSuffix,
        caseSensitive,
      });
      
      setSubmissionResults(response);
      toast.success(`Batch of ${patterns.length} vanity wallet requests submitted`);
      
      // Clear form on success
      setPatternsText("");
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to create batch of vanity wallets:", error);
      
      // Handle 403 Forbidden specifically
      if (error instanceof Error && error.message.includes('403')) {
        setError("Access denied. Super admin permissions required.");
        toast.error("Access denied: Super admin permissions required");
      } else {
        setError("Failed to create batch of vanity wallets. Please try again.");
        toast.error("Failed to create batch of vanity wallets");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5 text-green-400" />
        <h3 className="text-md font-medium text-gray-100">Batch Create Vanity Wallets</h3>
        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
          Super Admin Access ✓
        </span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patterns Textarea */}
        <div>
          <label htmlFor="patterns" className="block text-sm text-gray-400 mb-1">
            Patterns (one per line, 1-10 characters each)
          </label>
          <textarea
            id="patterns"
            value={patternsText}
            onChange={(e) => setPatternsText(e.target.value)}
            placeholder="Enter patterns (e.g. DUEL, MOON, DEGEN)"
            rows={5}
            className={`w-full bg-dark-400 border ${
              patternErrors.length > 0 ? "border-red-500" : "border-dark-300"
            } rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500`}
            disabled={isSubmitting}
          />
          {patternErrors.length > 0 && (
            <div className="mt-1">
              {patternErrors.map((err, index) => (
                <p key={index} className="text-sm text-red-400">{err}</p>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Only letters and numbers are allowed. Patterns are limited to characters that can appear in Solana addresses.
          </p>
        </div>
        
        {/* Pattern Counts */}
        <div className="flex justify-between">
          <span className="text-sm text-gray-400">Pattern Count: <span className="text-brand-400">{patterns.length}</span></span>
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
        
        {/* Submission Results */}
        {submissionResults && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <h4 className="text-sm font-medium text-green-400 mb-2">Submission Results</h4>
            <p className="text-sm text-gray-200">{submissionResults.message}</p>
            <div className="mt-2 max-h-40 overflow-y-auto">
              <div className="text-xs text-gray-400 space-y-1">
                {submissionResults.results.map((result, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="font-mono">{result.pattern}</span>
                    <span className={result.status === "accepted" ? "text-green-400" : "text-red-400"}>
                      {result.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || patterns.length === 0 || patternErrors.length > 0}
            className={`w-full px-4 py-2 rounded-lg ${
              isSubmitting || patterns.length === 0 || patternErrors.length > 0
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
              `Create ${patterns.length} Vanity Wallet${patterns.length !== 1 ? "s" : ""}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};