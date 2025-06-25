// src/stories/ContestDetailPage.stories.tsx
 
import type { Meta, StoryObj } from '@storybook/react';
import { motion } from 'framer-motion';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ParticipantsList } from '../components/contest-detail/ParticipantsList';
import { PrizeStructure } from '../components/contest-detail/PrizeStructure';
import { getContestImageUrl } from '../lib/imageUtils';
import { Contest } from '../types';
//import src from 'gsap/src';

// This is a standalone story version of the redesigned ContestDetailPage
// It's a simplified version that doesn't require all the context dependencies

// Helper function for mapping contest status
// @ts-ignore - Used as reference
const mapContestStatus = (status: string): any => {
  switch (status) {
    case 'pending':
      return 'upcoming';
    case 'active':
      return 'live';
    case 'completed':
    case 'cancelled':
      return 'completed';
    default:
      return 'upcoming';
  }
};

// Base contest object for all stories - UPDATED
const baseContest: Contest = {
  id: 123,
  name: 'Ultimate Degen Showdown',
  description: 'Compete with other degens to build the ultimate crypto portfolio. The top performers win big prizes!',
  entry_fee: '50',
  prize_pool: '5000',
  // max_participants: 100, // Moved to settings
  // min_participants: 10,  // Moved to settings
  participant_count: 42,
  start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), 
  end_time: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), 
  settings: {
    // min_trades: 10, // Removed
    difficulty: 'shark', // Already string, fine
    tokenTypesAllowed: ['DeFi', 'Gaming', 'Meme', 'Layer1', 'Layer2'], // Renamed
    // rules: [/*...*/], // Removed
    startingPortfolioValue: "10000", // Added
    minParticipants: 10, // Added from top-level, camelCase
    maxParticipants: 100, // Added from top-level, camelCase
  },
  status: 'pending',
  // These must remain top-level to satisfy the Contest type
  min_participants: 10, 
  max_participants: 100,
  allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  participants: Array(15).fill(null).map((_, i) => ({
    address: `0x${Math.random().toString(16).slice(2, 12)}`,
    username: `User${i+1}`,
    score: i === 0
    ? undefined
    : Number((Math.random() * 40 - 20).toFixed(2))
    })),
  is_participating: false,
  contest_code: 'DUEL123',
  image_url: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'
};

interface MobileContestDetailPageProps {
  contest: Contest;
  isParticipating?: boolean;
  isWalletConnected?: boolean;
  displayStatus?: 'pending' | 'active' | 'completed' | 'cancelled';
  error?: string | null;
}

// Component to mock the ContestDetailPage for Storybook
const MobileContestDetailPage: React.FC<MobileContestDetailPageProps> = ({ 
  contest,
  isParticipating = false, 
  isWalletConnected = true,
  displayStatus = 'pending',
  // @ts-ignore - not used in this simplified version
  error = null
}) => {
  // Local state for image loading
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  
  // Refs for mouse tracking
  const headerRef = React.useRef(null); 
  
  // @ts-ignore - Used as reference
  const getButtonLabel = () => {
    // Not connected - always show connect wallet
    if (!isWalletConnected) {
      return "Connect Wallet to Enter";
    }
    // Connected and participating
    if (isParticipating) {
      if (displayStatus === "completed") {
        return "View Results";
      } else if (displayStatus === "active") {
        return "View Live Contest";
      } else if (displayStatus === "cancelled") {
        return "View Details";
      } else {
        return "Modify Portfolio";
      }
    }
    // Connected but not participating
    if (displayStatus === "completed" || displayStatus === "active") {
      return displayStatus === "completed" ? "Contest Ended" : "Contest in Progress";
    } else if (displayStatus === "cancelled") {
      return "View Details";
    } else {
      return "Select Your Portfolio";
    }
  };

  // @ts-ignore - Used as reference
  const isButtonDisabled = () => {
    return (
      !isWalletConnected ||
      (!isParticipating && 
        (displayStatus === "completed" || 
         displayStatus === "active"))
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-dark-100">
      {/* Breadcrumb navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="flex items-center text-sm text-gray-400">
          <a href="/" className="hover:text-brand-400 transition-colors">
            Home
          </a>
          <span className="mx-2">›</span>
          <a href="/contests" className="hover:text-brand-400 transition-colors">
            Contests
          </a>
          <span className="mx-2">›</span>
          <span className="text-gray-300">{contest.name}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Contest Banner with Image */}
          <div 
            ref={headerRef}
            className="relative overflow-hidden rounded-lg mb-8"
          >
            {/* Contest Image with Parallax Effect */}
            {getContestImageUrl(contest.image_url) && (
              <div className="absolute inset-0 overflow-hidden">
                {/* Loading state */}
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-300/70 z-10">
                    <LoadingSpinner size="lg" />
                  </div>
                )}

                {/* Background image with parallax */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      transform: "scale(1.02)",
                      transition: "transform 0.3s ease-out"
                    }}
                  >
                    <img
                      src={getContestImageUrl(contest.image_url)}
                      alt={contest.name}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-dark-200/90 to-dark-200/60" />
                </motion.div>
              </div>
            )}
            
            {/* If no image or image error, show gradient background */}
            {(!getContestImageUrl(contest.image_url) || imageError) && (
              <div className="absolute inset-0 bg-gradient-to-br from-dark-200/80 to-dark-300/80" />
            )}
            
            {/* Banner Content */}
            <div className="relative z-10 p-4 sm:p-6 md:p-8 min-h-[280px] flex flex-col justify-end">
              {/* Status Badge - Top Right */}
              <div className="absolute top-4 right-4">
                {/* Different badge styles based on contest status */}
                {displayStatus === "active" && (
                  <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-green-500/30 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-brand-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-green-500/30 via-brand-500/30 to-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
                        <span className="relative rounded-full w-2 h-2 bg-green-400"></span>
                      </span>
                      <span className="text-xs font-bold text-green-400 uppercase tracking-wide font-cyber">LIVE</span>
                    </div>
                  </div>
                )}
                
                {displayStatus === "pending" && (
                  <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-blue-500/30 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-brand-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-blue-500/30 via-brand-500/30 to-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                      <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wide font-cyber">SOON</span>
                    </div>
                  </div>
                )}
                
                {displayStatus === "completed" && (
                  <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-gray-500/30 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-500/20 via-brand-500/20 to-gray-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-gray-500/30 via-brand-500/30 to-gray-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide font-cyber">ENDED</span>
                    </div>
                  </div>
                )}
                
                {displayStatus === "cancelled" && (
                  <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-red-500/30 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-brand-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-red-500/30 via-brand-500/30 to-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                      <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wide font-cyber">CANCELLED</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Contest Title and Description */}
              <div className="space-y-3 max-w-3xl">
                <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 animate-gradient-x">
                  {contest.name}
                </h1>
                <p className="text-base sm:text-lg text-gray-300">
                  {contest.description}
                </p>
                
                {/* Countdown Timer with status indicator */}
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-sm text-gray-400">
                    {displayStatus === "active" ? "Ends in:" : 
                    displayStatus === "pending" ? "Starts in:" : 
                    displayStatus === "cancelled" ? "Cancelled:" : "Ended:"}
                  </span>
                  
                  {displayStatus === "cancelled" ? (
                    <span className="line-through text-red-400 text-lg font-medium italic">
                      {new Date(contest.end_time).toLocaleDateString()}
                    </span>
                  ) : displayStatus !== "completed" ? (
                    <span className="text-green-400 text-lg font-medium">
                      {new Date(contest.end_time).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-lg font-medium">
                      {new Date(contest.end_time).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contest Details Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Left Column - Contest Details */}
          <div className="space-y-6">
            {/* Contest Rules - THIS SECTION NEEDS TO BE REMOVED OR UPDATED */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-300">Rules</h2>
              {/* Remove this ul or change its data source if rules are now elsewhere */}
              {/* <ul className="list-disc list-inside text-gray-400 space-y-2">
                {contest.settings.rules.map((rule, index) => (
                  <li key={index}>{rule.title}</li>
                ))}
              </ul> */}
              <p className="text-gray-400 italic">Contest rules are being updated. Please check back later or refer to the main contest description.</p>
            </div>
            
            {/* Prize Structure */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-300">Prize Structure</h2>
              <PrizeStructure 
                prizePool={Number(contest.prize_pool)}
                entryFee={Number(contest.entry_fee)}
                maxParticipants={contest.max_participants}
                currentParticipants={contest.participant_count}
                platformFeePercentage={5}
                ////////prizeStructure={contest.prize_structure}
              />
            </div>
          </div>
          
          {/* Right Column - Participants List */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-300">Participants</h2>
            <ParticipantsList 
              participants={contest.participants!.map(p => ({
                wallet_address: p.address,
                nickname: p.username || `User-${p.address.slice(0, 6)}`,
                portfolio_value: "1000",
                performance_percentage: p.score?.toString() || "0"
              }))}
              contestStatus={displayStatus === "pending" ? "upcoming" : 
                           displayStatus === "active" ? "live" : "completed"}
              contestId="123"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Define the Story type
type Story = StoryObj<typeof MobileContestDetailPage>;


const meta: Meta<typeof MobileContestDetailPage> = {
  title: 'Pages/ContestDetailPage',
  component: MobileContestDetailPage,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
};
export default meta;


// Upcoming contest (not participating)
export const UpcomingContest: Story = {
  render: () => (
    <MobileContestDetailPage 
      contest={baseContest} 
      displayStatus="pending"
      isParticipating={false} 
    />
  ),
};

// Upcoming contest (already participating)
export const UpcomingAlreadyEntered: Story = {
  render: () => (
    <MobileContestDetailPage 
      contest={baseContest} 
      displayStatus="pending"
      isParticipating={true} 
    />
  ),
};

// Live contest (not participating)
export const LiveContest: Story = {
  render: () => (
    <MobileContestDetailPage 
      contest={{
        ...baseContest,
        status: 'active',
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24h in past
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h in future
      }} 
      displayStatus="active"
      isParticipating={false} 
    />
  ),
};

// Live contest (participating)
export const LiveContestParticipating: Story = {
  render: () => (
    <MobileContestDetailPage 
      contest={{
        ...baseContest,
        status: 'active',
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24h in past
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h in future
      }} 
      displayStatus="active"
      isParticipating={true} 
    />
  ),
};

// Completed contest
export const CompletedContest: Story = {
  render: () => (
    <MobileContestDetailPage 
      contest={{
        ...baseContest,
        status: 'completed',
        start_time: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 72h in past
        end_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24h in past
      }} 
      displayStatus="completed"
      isParticipating={false} 
    />
  ),
};

// Completed contest (participated)
export const CompletedContestParticipated: Story = {
  render: () => (
    <MobileContestDetailPage 
      contest={{
        ...baseContest,
        status: 'completed',
        start_time: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 72h in past
        end_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24h in past
      }} 
      displayStatus="completed"
      isParticipating={true} 
    />
  ),
};

// Cancelled contest
export const CancelledContest: Story = {
  render: () => (
    <MobileContestDetailPage 
      contest={{
        ...baseContest,
        status: 'cancelled',
        cancellation_reason: 'Insufficient participants to proceed',
      }} 
      displayStatus="cancelled"
      isParticipating={false} 
    />
  ),
};

// Not connected to wallet
export const NotConnected: Story = {
  render: () => (
    <MobileContestDetailPage 
      contest={baseContest} 
      displayStatus="pending"
      isParticipating={false} 
      isWalletConnected={false}
    />
  ),
};

// With error message
export const WithErrorMessage: Story = {
  render: () => (
    <MobileContestDetailPage 
      contest={baseContest} 
      displayStatus="active"
      isParticipating={false} 
      error="This contest is already in progress and not accepting new entries."
    />
  ),
};