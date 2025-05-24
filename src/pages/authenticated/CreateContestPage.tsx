// src/pages/authenticated/CreateContestPage.tsx

/**
 * CreateContestPage.tsx
 * 
 * @description This page is responsible for displaying the CreateContestModal.
 * It also handles fetching user credits and determining the user's role.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-05-07
 * @updated 2025-05-07
 */

import console from 'console';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateContestModal } from '../../components/contest-browser/CreateContestModal';
import LoadingFallback from '../../components/shared/LoadingFallback';
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';

export const CreateContestPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useMigratedAuth();
  const { user, isAuthenticated, isLoading: authIsLoading, getToken, isAdministrator } = auth;
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal will be controlled to be open once data is ready

  const [availableCredits, setAvailableCredits] = useState(0);
  const [creditsLoading, setCreditsLoading] = useState(true);

  useEffect(() => {
    if (!authIsLoading && !isAuthenticated) {
      navigate('/login'); // Redirect if not authenticated
    }
  }, [authIsLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const fetchUserCredits = async () => {
      if (isAuthenticated && isAdministrator) {
        // Admins don't need a credit check, assume effectively infinite
        setAvailableCredits(999); 
        setCreditsLoading(false);
        return;
      }
      
      if (isAuthenticated && !isAdministrator) {
        // For regular users, fetch credit stats
        setCreditsLoading(true);
        try {
          const token = await getToken();
          if (!token) {
             throw new Error('Authentication token not available');
          }

          const response = await fetch('/api/contests/credits?stats_only=true', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            console.error(`Failed to fetch credit stats: ${response.status}`);
            throw new Error('Failed to fetch credit stats');
          }

          const data = await response.json();
          if (data.success && data.data) {
            setAvailableCredits(data.data.unused || 0);
          } else {
            console.error("Failed to parse credit stats response:", data);
            setAvailableCredits(0);
          }
        } catch (error) {
          console.error("Failed to fetch user credits", error);
          setAvailableCredits(0);
        } finally {
          setCreditsLoading(false);
        }
      } else if (!authIsLoading && !isAuthenticated) {
        setCreditsLoading(false); // Not authenticated, no credits to load
      }
    };

    fetchUserCredits();
  }, [user, isAuthenticated, authIsLoading, getToken, isAdministrator]);

  useEffect(() => {
    // Open the modal once authentication and credit data are loaded
    if (!authIsLoading && !creditsLoading && isAuthenticated) {
      setIsModalOpen(true);
    }
  }, [authIsLoading, creditsLoading, isAuthenticated]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    navigate('/contest-credits'); // Navigate back to credits page after closing
  };

  const handleContestCreated = () => {
    // The modal itself handles navigation to the new contest or contest browser
    // So, just close the modal representation on this page
    setIsModalOpen(false); 
    // Optionally, navigate somewhere specific if the modal's own navigation isn't desired here.
    // navigate('/my-contests'); 
  };

  if (authIsLoading || creditsLoading) {
    return <LoadingFallback message="Loading contest creator..." />;
  }

  if (!isAuthenticated) {
    // This case should ideally be handled by AuthenticatedRoute wrapper,
    // but as a fallback:
    return <LoadingFallback message="Redirecting to login..." />;
  }
  
  // Determine user role for the modal using the boolean isAdministrator property
  const userRole = isAdministrator ? 'admin' : 'user';


  return (
    <div className="create-contest-page-container">
      {/* 
        This page acts as a host for the CreateContestModal.
        The modal will be enhanced to understand user roles and credits.
      */}
      {isModalOpen && user && (
        <CreateContestModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleContestCreated}
          // Pass the determined role and credits
          userRole={userRole} 
          availableCredits={availableCredits}
        />
      )}
      {/* Fallback content if modal isn't open for some reason, or page structure */}
      {!isModalOpen && (
         <div className="flex flex-col items-center justify-center min-h-screen">
            <p className="text-lg text-gray-400">Preparing contest creator...</p>
            {/* Optionally, a button to manually open modal if something went wrong */}
         </div>
      )}
    </div>
  );
};

export default CreateContestPage; 