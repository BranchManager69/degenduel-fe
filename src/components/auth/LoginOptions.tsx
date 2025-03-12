//import React from 'react';
import { ConnectWalletButton } from "./ConnectWalletButton";
import TwitterLoginButton from "./TwitterLoginButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Divider } from "../ui/Divider";

/**
 * Login Options Component
 *
 * Displays all available login options for the user including:
 * 1. Primary method - Connect Wallet (Phantom, etc.)
 * 2. Alternative methods - Twitter (if previously linked)
 */
const LoginOptions = () => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Login to DegenDuel</CardTitle>
        <CardDescription>
          Connect with your wallet or use a linked social account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Primary Login Method */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Connect Wallet</h3>
          <ConnectWalletButton className="w-full py-6" />
        </div>

        {/* Alternative Login Methods */}
        <div className="space-y-3">
          <div className="relative">
            <Divider>
              <span className="px-2 text-xs text-gray-500 bg-white">
                or continue with
              </span>
            </Divider>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <TwitterLoginButton className="w-full" />
            {/* Additional social login options can be added here */}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center text-sm text-gray-500">
        <p>Don't have an account? Connect your wallet to create one.</p>
      </CardFooter>
    </Card>
  );
};

export default LoginOptions;
