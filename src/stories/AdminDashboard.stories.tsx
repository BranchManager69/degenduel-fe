// src/stories/AdminDashboard.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect, useState } from 'react';

// Simplified version of the actual CyberGrid component used in the app
const CyberBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden z-0">
      {/* Main background color */}
      <div className="absolute inset-0 bg-gradient-to-br from-darkGrey-dark via-darkGrey to-mauve-dark z-0"></div>
      
      {/* CyberGrid implementation - matches the actual component */}
      <div 
        className="absolute inset-0 opacity-10 z-1"
        style={{
          backgroundImage: 'linear-gradient(#9D4EDD 1px, transparent 1px), linear-gradient(90deg, #9D4EDD 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Floating particles simulation */}
      <div className="absolute inset-0 pointer-events-none z-2">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-mauve-light rounded-full opacity-30 animate-cyber-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              transform: `scale(${Math.random() + 0.5})`,
              boxShadow: '0 0 5px rgba(157, 78, 221, 0.5)'
            }}
          />
        ))}
      </div>
      
      {/* Scanner effects from the actual app */}
      <div className="absolute inset-0 overflow-hidden z-3" style={{ opacity: 0.3 }}>
        {/* Scanning line - left */}
        <div
          className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-scan-vertical"
          style={{ left: "20%", animationDelay: "-2s" }}
        />
        {/* Scanning line - right */}
        <div
          className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-scan-vertical"
          style={{ left: "80%", animationDelay: "-2s" }}
        />
        {/* Horizontal scan line */}
        <div 
          className="absolute h-px w-full bg-gradient-to-r from-transparent via-brand-400/30 to-transparent animate-scan-fast"
          style={{ top: '30%' }}
        />
      </div>
    </div>
  );
};

// Instead of importing the actual AdminDashboard component with all its dependencies,
// we'll create a simplified version that just showcases the layout structure
const SimplifiedAdminDashboard: React.FC<{
  showSystemAlerts?: boolean;
  maintenanceMode?: boolean;
}> = ({ 
  showSystemAlerts = false,
  maintenanceMode = false 
}) => {
  // Add a simulated loading state
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate initial loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* Animated background */}
      <CyberBackground />
      
      {/* Top overlay fade to make content more readable */}
      <div className="fixed inset-0 bg-gradient-to-b from-dark-100/40 to-transparent h-40 pointer-events-none" style={{ zIndex: 5 }}></div>
      
      {/* Main content container - scrollable while background stays fixed */}
      <div className="relative container mx-auto p-6 space-y-8 z-10">
        {/* Header with animated gradient */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <h1 className="text-3xl font-display text-gray-100 relative group">
              <span className="bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent animate-gradientX">
                Admin Control Center
              </span>
              <span className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-brand-400 to-cyber-400 transform opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </h1>
            <p className="text-gray-400 mt-2 font-mono text-sm">
              System management and monitoring interface
              <span className="inline-block ml-1 w-2 h-4 bg-brand-500 opacity-80 animate-pulse"></span>
            </p>
          </div>
          <div className="flex gap-3">
            {/* Quick action buttons with animation */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-2 overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20"
                 style={{
                   background: 'linear-gradient(45deg, rgba(217, 119, 6, 0.15), rgba(245, 158, 11, 0.25))',
                   borderColor: 'rgba(245, 158, 11, 0.4)'
                 }}>
              {/* Scanner line effect */}
              <div className="absolute inset-0 w-full h-px bg-amber-400/50 -translate-x-full group-hover:translate-x-full duration-1000 ease-in-out transition-transform"></div>
              
              <div className="text-amber-300 text-xl">🐛</div>
              <span className="text-amber-100 font-semibold">
                Client Error Management
              </span>
            </div>
          </div>
        </div>

        {/* System Alerts with animated effects */}
        {showSystemAlerts && (
          <div className="bg-dark-200/60 backdrop-blur-lg p-6 border border-brand-500/30 shadow-lg relative overflow-hidden">
            {/* Animated scanner line */}
            <div className="absolute inset-0 w-full h-px bg-brand-400/30 animate-scan-fast"></div>
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-100 font-display">
                System Alerts
                <span className="ml-2 inline-block w-2 h-2 bg-red-500 animate-pulse"></span>
              </h2>
              <button className="text-gray-400 hover:text-gray-300 relative group">
                Clear All
                <span className="absolute -bottom-px left-0 right-0 h-px bg-gray-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 border-2 bg-red-500/10 border-red-500/30 relative overflow-hidden group hover:bg-red-500/15 transition-colors duration-300">
                {/* Animated scanner */}
                <div className="absolute inset-0 w-full h-16 bg-gradient-to-r from-transparent via-red-500/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1500 ease-in-out transition-transform"></div>
                
                {/* Corner marker */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500/70"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500/70"></div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-xl text-red-400">⚠</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-red-400 font-mono">Circuit Breaker Activated</h3>
                      <span className="text-xs text-gray-500 font-mono">14:25:06</span>
                    </div>
                    <p className="text-gray-300 mt-1 text-sm">Service market-data has been suspended due to multiple failures.</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-2 bg-yellow-500/10 border-yellow-500/30 relative overflow-hidden group hover:bg-yellow-500/15 transition-colors duration-300">
                {/* Animated scanner */}
                <div className="absolute inset-0 w-full h-16 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1500 ease-in-out transition-transform"></div>
                
                {/* Corner marker */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500/70"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500/70"></div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-xl text-yellow-400">⚡</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-yellow-400 font-mono">Resource Warning</h3>
                      <span className="text-xs text-gray-500 font-mono">14:20:12</span>
                    </div>
                    <p className="text-gray-300 mt-1 text-sm">Database connection pool nearing capacity (85%).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Maintenance Mode Control with enhanced cyber effects */}
        {maintenanceMode && (
          <div className="bg-dark-200/60 backdrop-blur-lg p-8 border border-brand-500/30 relative overflow-hidden shadow-lg">
            {/* Background scanner effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/0 via-red-900/10 to-red-900/0 animate-pulse-slow"></div>
            {/* Horizontal scan line */}
            <div className="absolute inset-0 h-px w-full bg-red-500/40 animate-scan-fast"></div>
            {/* Vertical scan line */}
            <div className="absolute inset-0 w-px h-full bg-red-500/20 animate-cyber-scan delay-1000"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display tracking-wider text-2xl bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent animate-pulse-slow">
                    MAINTENANCE MODE
                  </h2>
                  <p className="text-sm text-gray-400 font-mono mt-1">
                    SYSTEM_MAINTENANCE_CONTROL_INTERFACE
                  </p>
                </div>
                <div className="h-3 w-3 bg-red-500 animate-pulse shadow-lg shadow-red-500/30" />
              </div>

              <button className="w-full group relative">
                <div className="relative overflow-hidden border-2 border-red-500/60 bg-red-500/15 transition-all duration-300 hover:bg-red-500/25">
                  {/* Background scanner effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>
                  
                  {/* Corner markers for cyberpunk feel */}
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-red-400/80"></div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-red-400/80"></div>
                  
                  {/* Key Lock Effect */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 border-2 border-red-500 border-r-0 border-b-0 transition-colors duration-300 group-hover:border-red-400">
                      <div className="w-1 h-3 bg-red-500 transition-colors duration-300 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 group-hover:bg-red-400 group-hover:rotate-90 transition-transform" />
                    </div>
                  </div>

                  {/* Button Content */}
                  <div className="px-6 py-4 pl-12">
                    <div className="font-display tracking-wider text-lg">
                      <span className="text-red-400 group-hover:text-red-300 transition-colors">DEACTIVATE MAINTENANCE</span>
                    </div>
                  </div>
                </div>

                {/* Power Indicator */}
                <div className="absolute -right-3 top-1/2 -translate-y-1/2">
                  <div className="w-6 h-6 bg-red-500 animate-pulse shadow-lg shadow-red-500/50 transition-colors duration-300 group-hover:shadow-red-500/70" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Loading state - show skeleton if loading */}
        {loading ? (
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <div className="h-10 w-40 bg-purple-500/20"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border-2 border-purple-500/20 p-6 h-32 bg-dark-200/40"></div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="h-64 bg-dark-200/40 border-2 border-dark-300/30"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main content area with a vertical orientation */}
            <div className="lg:col-span-3 space-y-6">
              {/* First row: User Management and Contest Management side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Management Section */}
                <div>
                  <h2 className="text-xl font-display mb-3">
                    <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent animate-gradientX">
                      User Management
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {/* User Management Card */}
                    <div className="bg-dark-200/75 backdrop-blur-lg border-2 border-purple-500/40 hover:border-purple-500/60 p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/20">
                      {/* Scanner line effect */}
                      <div className="absolute inset-0 h-px w-full bg-purple-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                      
                      {/* Header with enhanced color theme */}
                      <div className="flex items-center mb-3">
                        <div className="text-2xl text-purple-300 mr-3">👥</div>
                        <h3 className="text-lg font-bold text-purple-300 font-display tracking-wide">User Management</h3>
                      </div>
                      
                      {/* Divider that matches the card's color theme */}
                      <div className="w-1/3 h-px bg-gradient-to-r from-purple-500/70 to-transparent mb-3"></div>
                      
                      {/* Enhanced description with better formatting */}
                      <p className="text-gray-300 text-sm font-mono">
                        <span className="text-purple-200">→</span> View and manage user accounts
                        <br/>
                        <span className="text-purple-200">→</span> Update user permissions
                      </p>
                      
                      {/* Corner accent - sharper edge */}
                      <div className="absolute -bottom-0 -right-0 w-8 h-8">
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-purple-500/70"></div>
                      </div>
                    </div>
                    
                    {/* IP Ban Management Card */}
                    <div className="bg-dark-200/75 backdrop-blur-lg border-2 border-purple-500/40 hover:border-purple-500/60 p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/20">
                      {/* Scanner line effect */}
                      <div className="absolute inset-0 h-px w-full bg-purple-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                      
                      {/* Header with enhanced color theme */}
                      <div className="flex items-center mb-3">
                        <div className="text-2xl text-purple-300 mr-3">🛡️</div>
                        <h3 className="text-lg font-bold text-purple-300 font-display tracking-wide">IP Ban Management</h3>
                      </div>
                      
                      {/* Divider that matches the card's color theme */}
                      <div className="w-1/3 h-px bg-gradient-to-r from-purple-500/70 to-transparent mb-3"></div>
                      
                      {/* Enhanced description with better formatting */}
                      <p className="text-gray-300 text-sm font-mono">
                        <span className="text-purple-200">→</span> Manage banned IP addresses
                        <br/>
                        <span className="text-purple-200">→</span> Check IP status and history
                      </p>
                      
                      {/* Corner accent - sharper edge */}
                      <div className="absolute -bottom-0 -right-0 w-8 h-8">
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-purple-500/70"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contest Management Section */}
                <div>
                  <h2 className="text-xl font-display mb-3">
                    <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent animate-gradientX">
                      Contest Management
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Contest Control Card */}
                    <div className="bg-dark-200/75 backdrop-blur-lg border-2 border-yellow-500/40 hover:border-yellow-500/60 p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20">
                      {/* Scanner line effect */}
                      <div className="absolute inset-0 h-px w-full bg-yellow-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                      
                      {/* Header with enhanced color theme */}
                      <div className="flex items-center mb-3">
                        <div className="text-2xl text-yellow-300 mr-3">🏆</div>
                        <h3 className="text-lg font-bold text-yellow-300 font-display tracking-wide">Contest Control</h3>
                      </div>
                      
                      {/* Divider that matches the card's color theme */}
                      <div className="w-1/3 h-px bg-gradient-to-r from-yellow-500/70 to-transparent mb-3"></div>
                      
                      {/* Enhanced description with better formatting */}
                      <p className="text-gray-300 text-sm font-mono">
                        <span className="text-yellow-200">→</span> Create new contests
                        <br/>
                        <span className="text-yellow-200">→</span> Manage active contests
                      </p>
                      
                      {/* Corner accent - sharper edge */}
                      <div className="absolute -bottom-0 -right-0 w-8 h-8">
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-yellow-500/70"></div>
                      </div>
                    </div>
                    
                    {/* Chat Dashboard Card */}
                    <div className="bg-dark-200/75 backdrop-blur-lg border-2 border-yellow-500/40 hover:border-yellow-500/60 p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20">
                      {/* Scanner line effect */}
                      <div className="absolute inset-0 h-px w-full bg-yellow-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                      
                      {/* Header with enhanced color theme */}
                      <div className="flex items-center mb-3">
                        <div className="text-2xl text-yellow-300 mr-3">💬</div>
                        <h3 className="text-lg font-bold text-yellow-300 font-display tracking-wide">Chat Dashboard</h3>
                      </div>
                      
                      {/* Divider that matches the card's color theme */}
                      <div className="w-1/3 h-px bg-gradient-to-r from-yellow-500/70 to-transparent mb-3"></div>
                      
                      {/* Enhanced description with better formatting */}
                      <p className="text-gray-300 text-sm font-mono">
                        <span className="text-yellow-200">→</span> Monitor contest chats
                        <br/>
                        <span className="text-yellow-200">→</span> Review user communications
                      </p>
                      
                      {/* Corner accent - sharper edge */}
                      <div className="absolute -bottom-0 -right-0 w-8 h-8">
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-yellow-500/70"></div>
                      </div>
                    </div>
                    
                    {/* Reclaim Contest Funds Card */}
                    <div className="bg-dark-200/75 backdrop-blur-lg border-2 border-yellow-500/40 hover:border-yellow-500/60 p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20">
                      {/* Scanner line effect */}
                      <div className="absolute inset-0 h-px w-full bg-yellow-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                      
                      {/* Header with enhanced color theme */}
                      <div className="flex items-center mb-3">
                        <div className="text-2xl text-yellow-300 mr-3">💸</div>
                        <h3 className="text-lg font-bold text-yellow-300 font-display tracking-wide">Reclaim Contest Funds</h3>
                      </div>
                      
                      {/* Divider that matches the card's color theme */}
                      <div className="w-1/3 h-px bg-gradient-to-r from-yellow-500/70 to-transparent mb-3"></div>
                      
                      {/* Enhanced description with better formatting */}
                      <p className="text-gray-300 text-sm font-mono">
                        <span className="text-yellow-200">→</span> Reclaim unused funds
                        <br/>
                        <span className="text-yellow-200">→</span> Balance contest wallets
                      </p>
                      
                      {/* Corner accent - sharper edge */}
                      <div className="absolute -bottom-0 -right-0 w-8 h-8">
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-yellow-500/70"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second row: Financial Operations */}
              <div className="mt-8">
                <h2 className="text-xl font-display mb-3">
                  <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent animate-gradientX">
                    Financial Operations
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Balance Management Card */}
                  <div className="bg-dark-200/75 backdrop-blur-lg border-2 border-green-500/40 hover:border-green-500/60 p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/20">
                    {/* Scanner line effect */}
                    <div className="absolute inset-0 h-px w-full bg-green-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                    
                    {/* Header with enhanced color theme */}
                    <div className="flex items-center mb-3">
                      <div className="text-2xl text-green-300 mr-3">💰</div>
                      <h3 className="text-lg font-bold text-green-300 font-display tracking-wide">Balance Management</h3>
                    </div>
                    
                    {/* Divider that matches the card's color theme */}
                    <div className="w-1/3 h-px bg-gradient-to-r from-green-500/70 to-transparent mb-3"></div>
                    
                    {/* Enhanced description with better formatting */}
                    <p className="text-gray-300 text-sm font-mono">
                      <span className="text-green-200">→</span> User balance control
                      <br/>
                      <span className="text-green-200">→</span> Transaction management
                    </p>
                    
                    {/* Corner accent - sharper edge */}
                    <div className="absolute -bottom-0 -right-0 w-8 h-8">
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-green-500/70"></div>
                    </div>
                  </div>
                  
                  {/* Transaction History Card */}
                  <div className="bg-dark-200/75 backdrop-blur-lg border-2 border-green-500/40 hover:border-green-500/60 p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/20">
                    {/* Scanner line effect */}
                    <div className="absolute inset-0 h-px w-full bg-green-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                    
                    {/* Header with enhanced color theme */}
                    <div className="flex items-center mb-3">
                      <div className="text-2xl text-green-300 mr-3">📝</div>
                      <h3 className="text-lg font-bold text-green-300 font-display tracking-wide">Transaction History</h3>
                    </div>
                    
                    {/* Divider that matches the card's color theme */}
                    <div className="w-1/3 h-px bg-gradient-to-r from-green-500/70 to-transparent mb-3"></div>
                    
                    {/* Enhanced description with better formatting */}
                    <p className="text-gray-300 text-sm font-mono">
                      <span className="text-green-200">→</span> View transaction logs
                      <br/>
                      <span className="text-green-200">→</span> Track financial activity
                    </p>
                    
                    {/* Corner accent - sharper edge */}
                    <div className="absolute -bottom-0 -right-0 w-8 h-8">
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-green-500/70"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Third row: System section split into two columns */}
              <div className="mt-8">
                <h2 className="text-xl font-display mb-3">
                  <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent animate-gradientX">
                    System
                  </span>
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Core System */}
                  <div>
                    <div className="mb-2 text-sm font-semibold text-blue-300 uppercase tracking-wide">
                      Core System
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Activity Monitor Card */}
                      <div className="bg-dark-200/75 backdrop-blur-lg border-2 border-blue-500/40 hover:border-blue-500/60 p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20">
                        {/* Scanner line effect */}
                        <div className="absolute inset-0 h-px w-full bg-blue-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                        
                        {/* Header with enhanced color theme */}
                        <div className="flex items-center mb-3">
                          <div className="text-2xl text-blue-300 mr-3">📈</div>
                          <h3 className="text-lg font-bold text-blue-300 font-display tracking-wide">Activity Monitor</h3>
                        </div>
                        
                        {/* Divider that matches the card's color theme */}
                        <div className="w-1/3 h-px bg-gradient-to-r from-blue-500/70 to-transparent mb-3"></div>
                        
                        {/* Enhanced description with better formatting */}
                        <p className="text-gray-300 text-sm font-mono">
                          <span className="text-blue-200">→</span> Real-time activity tracking
                          <br/>
                          <span className="text-blue-200">→</span> System event monitoring
                        </p>
                        
                        {/* Corner accent - sharper edge */}
                        <div className="absolute -bottom-0 -right-0 w-8 h-8">
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-blue-500/70"></div>
                        </div>
                      </div>
                      
                      {/* System Reports Card */}
                      <div className="bg-dark-200/75 backdrop-blur-lg border-2 border-blue-500/40 hover:border-blue-500/60 p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20">
                        {/* Scanner line effect */}
                        <div className="absolute inset-0 h-px w-full bg-blue-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                        
                        {/* Header with enhanced color theme */}
                        <div className="flex items-center mb-3">
                          <div className="text-2xl text-blue-300 mr-3">📊</div>
                          <h3 className="text-lg font-bold text-blue-300 font-display tracking-wide">System Reports</h3>
                        </div>
                        
                        {/* Divider that matches the card's color theme */}
                        <div className="w-1/3 h-px bg-gradient-to-r from-blue-500/70 to-transparent mb-3"></div>
                        
                        {/* Enhanced description with better formatting */}
                        <p className="text-gray-300 text-sm font-mono">
                          <span className="text-blue-200">→</span> Generate health reports
                          <br/>
                          <span className="text-blue-200">→</span> View system analytics
                        </p>
                        
                        {/* Corner accent - sharper edge */}
                        <div className="absolute -bottom-0 -right-0 w-8 h-8">
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-blue-500/70"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Testing & Playground */}
                  <div>
                    <div className="mb-2 text-sm font-semibold text-blue-300 uppercase tracking-wide">
                      Testing & Playground
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Client Error Management Card */}
                      <div className="bg-dark-200/75 backdrop-blur-lg border-2 border-blue-500/40 hover:border-blue-500/60 p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20">
                        {/* Scanner line effect */}
                        <div className="absolute inset-0 h-px w-full bg-blue-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                        
                        {/* Header with enhanced color theme */}
                        <div className="flex items-center mb-3">
                          <div className="text-2xl text-blue-300 mr-3">🐛</div>
                          <h3 className="text-lg font-bold text-blue-300 font-display tracking-wide">Client Error Management</h3>
                        </div>
                        
                        {/* Divider that matches the card's color theme */}
                        <div className="w-1/3 h-px bg-gradient-to-r from-blue-500/70 to-transparent mb-3"></div>
                        
                        {/* Enhanced description with better formatting */}
                        <p className="text-gray-300 text-sm font-mono">
                          <span className="text-blue-200">→</span> Track client-side errors
                          <br/>
                          <span className="text-blue-200">→</span> Debug user-reported issues
                        </p>
                        
                        {/* Corner accent - sharper edge */}
                        <div className="absolute -bottom-0 -right-0 w-8 h-8">
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-blue-500/70"></div>
                        </div>
                      </div>
                      
                      {/* WebSocket Hub Card */}
                      <div className="bg-dark-200/75 backdrop-blur-lg border-2 border-blue-500/40 hover:border-blue-500/60 p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20">
                        {/* Scanner line effect */}
                        <div className="absolute inset-0 h-px w-full bg-blue-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                        
                        {/* Header with enhanced color theme */}
                        <div className="flex items-center mb-3">
                          <div className="text-2xl text-blue-300 mr-3">🌐</div>
                          <h3 className="text-lg font-bold text-blue-300 font-display tracking-wide">WebSocket Hub</h3>
                        </div>
                        
                        {/* Divider that matches the card's color theme */}
                        <div className="w-1/3 h-px bg-gradient-to-r from-blue-500/70 to-transparent mb-3"></div>
                        
                        {/* Enhanced description with better formatting */}
                        <p className="text-gray-300 text-sm font-mono">
                          <span className="text-blue-200">→</span> WebSocket monitoring
                          <br/>
                          <span className="text-blue-200">→</span> Connection management
                        </p>
                        
                        {/* Corner accent - sharper edge */}
                        <div className="absolute -bottom-0 -right-0 w-8 h-8">
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-blue-500/70"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - 25% width on desktop, full width on mobile */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Admin Logs Panel styled like the real component */}
                <div className="bg-dark-200/60 backdrop-blur-sm border border-dark-300 p-4 shadow-lg relative">
                  {/* Header with refresh button */}
                  <div className="flex items-center justify-between mb-4 relative">
                    <h2 className="text-lg font-bold text-white">Recent Admin Actions</h2>
                    <button className="text-xs text-cyber-400 hover:text-cyber-300 flex items-center">
                      <span className="mr-1">↻</span> Refresh
                    </button>
                  </div>
                  
                  {/* Log items - using the actual structure from the real component */}
                  <div className="space-y-2 mb-4">
                    {/* Ban User Example */}
                    <div className="bg-dark-300/60 border-2 border-dark-400 overflow-hidden hover:bg-dark-300/80 transition-colors">
                      {/* Edge-to-edge colored header with action and time */}
                      <div className="flex items-center justify-between px-3 py-2 bg-red-900/50 text-red-200">
                        <span className="text-xs font-medium whitespace-nowrap">
                          BAN_USER
                        </span>
                        <span className="text-xs opacity-80 whitespace-nowrap">
                          Apr 1, 14:25
                        </span>
                      </div>
                      
                      {/* Content area with padding */}
                      <div className="p-3">
                        {/* Details as a grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">user id</span>
                            <span className="text-gray-300 text-sm truncate">123</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">username</span>
                            <span className="text-gray-300 text-sm truncate">badactor42</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">reason</span>
                            <span className="text-gray-300 text-sm truncate">Spam</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">duration</span>
                            <span className="text-gray-300 text-sm truncate">Permanent</span>
                          </div>
                        </div>
                        
                        {/* Footer with admin address and IP */}
                        <div className="mt-3 pt-2 border-t border-dark-400 flex items-center justify-between text-xs">
                          <div className="font-mono">
                            <span className="text-gray-500">Admin1</span>
                          </div>
                          <div className="text-gray-500 truncate max-w-[50%]">
                            192.168.1.1
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Create Contest Example */}
                    <div className="bg-dark-300/60 border-2 border-dark-400 overflow-hidden hover:bg-dark-300/80 transition-colors">
                      {/* Edge-to-edge colored header with action and time */}
                      <div className="flex items-center justify-between px-3 py-2 bg-green-900/50 text-green-200">
                        <span className="text-xs font-medium whitespace-nowrap">
                          CREATE_CONTEST
                        </span>
                        <span className="text-xs opacity-80 whitespace-nowrap">
                          Apr 1, 13:40
                        </span>
                      </div>
                      
                      {/* Content area with padding */}
                      <div className="p-3">
                        {/* Details as a grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">contest id</span>
                            <span className="text-gray-300 text-sm truncate">42</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">name</span>
                            <span className="text-gray-300 text-sm truncate">Weekend Duel</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">entry fee</span>
                            <span className="text-gray-300 text-sm truncate">10 USDC</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">start time</span>
                            <span className="text-gray-300 text-sm truncate">Apr 2, 12:00</span>
                          </div>
                        </div>
                        
                        {/* Footer with admin address and IP */}
                        <div className="mt-3 pt-2 border-t border-dark-400 flex items-center justify-between text-xs">
                          <div className="font-mono">
                            <span className="text-gray-500">Admin2</span>
                          </div>
                          <div className="text-gray-500 truncate max-w-[50%]">
                            192.168.1.2
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Pagination controls - fixed to match real component exactly */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      Showing 1 of 5 pages
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={true}
                        className="px-3 py-1 text-xs border-2 border-gray-700 bg-gray-900/40 text-gray-600 cursor-not-allowed whitespace-nowrap"
                      >
                        ← Prev
                      </button>
                      <button
                        className="px-3 py-1 text-xs border-2 border-cyber-500/60 bg-cyber-900/25 text-cyber-400 hover:bg-cyber-900/40 whitespace-nowrap"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* No other sidebars in the actual component */}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Create the meta object for the story
// Add a description for the Dashboard that will appear in Storybook
const meta: Meta<typeof SimplifiedAdminDashboard> = {
  title: 'Pages/AdminDashboard',
  component: SimplifiedAdminDashboard,
  parameters: {
    layout: 'fullscreen',
    route: '/admin',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0a1f' }, // Updated dark color to match app theme
      ],
    },
    docs: {
      description: {
        component: `
# Admin Dashboard

This component provides a comprehensive interface for site administration, organized into logical categories:

- **User Management**: User-related administrative tools
- **Contest Management**: Tools for creating and managing contests
- **Financial Operations**: Financial management tools
- **System Core**: Core system monitoring and management
- **Testing & Playground**: Testing tools and experimental features

The dashboard includes a sidebar with recent admin actions and system stats.
        `,
      },
    },
  },
  // Enable argTypes for better control in Storybook
  argTypes: {
    showSystemAlerts: {
      control: 'boolean',
      description: 'Show system alerts section',
      defaultValue: false,
    },
    maintenanceMode: {
      control: 'boolean',
      description: 'Show maintenance mode banner',
      defaultValue: false,
    },
  },
  // Use global MemoryRouter from preview.tsx
  decorators: [
    (Story) => (
      <div className="font-sans text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SimplifiedAdminDashboard>;

// The default story
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default admin dashboard view showing all management categories.',
      },
    },
  },
};

// Story with system alerts
export const WithSystemAlerts: Story = {
  args: {
    showSystemAlerts: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin dashboard with system alerts shown at the top.',
      },
    },
  },
};

// Story with maintenance mode
export const MaintenanceMode: Story = {
  args: {
    maintenanceMode: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin dashboard in maintenance mode, showing the maintenance banner.',
      },
    },
  },
};

// Story with both features
export const WithAlertsAndMaintenance: Story = {
  args: {
    showSystemAlerts: true,
    maintenanceMode: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin dashboard showing both system alerts and maintenance mode.',
      },
    },
  },
};