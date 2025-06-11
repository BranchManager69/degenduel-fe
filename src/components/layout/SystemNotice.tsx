import React, { useEffect, useState } from 'react';
// import { ImportantNotice } from './ImportantNotice';
import { API_URL } from '../../config/config';
import { useScrollHeader } from '../../hooks/ui/useScrollHeader';

interface SystemNoticeData {
  id: number;
  title: string | null;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export const SystemNotice: React.FC = () => {
  const [notice, setNotice] = useState<SystemNoticeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  
  // Use the same compact logic as EdgeToEdgeTicker
  const { isCompact } = useScrollHeader(50);

  useEffect(() => {
    const fetchSystemNotice = async () => {
      try {
        const response = await fetch(`${API_URL}/system/system-notices/active`);
        const data = await response.json();
        setNotice(data);
      } catch (error) {
        console.error('Failed to fetch system notice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemNotice();
  }, []);

  // Check if this notice was previously dismissed
  useEffect(() => {
    if (notice && localStorage.getItem(`system-notice-dismissed-${notice.id}`)) {
      setDismissed(true);
    }
  }, [notice]);

  const handleDismiss = () => {
    setDismissed(true);
    // Optionally, store dismissal in localStorage with notice ID
    // to prevent showing the same notice again after page refresh
    if (notice) {
      localStorage.setItem(`system-notice-dismissed-${notice.id}`, 'true');
    }
  };

  // Don't show anything while loading or if no notice
  if (loading) {
    return null;
  }
  
  if (!notice || dismissed) {
    return null;
  }
  
  // Type-based styling
  const typeStyles = {
    info: {
      bg: 'from-blue-500/15 via-cyan-500/15 to-blue-500/15',
      border: 'border-blue-500/40',
      text: 'text-blue-200',
      icon: 'ℹ️'
    },
    warning: {
      bg: 'from-yellow-500/15 via-amber-500/15 to-yellow-500/15',
      border: 'border-yellow-500/40',
      text: 'text-yellow-200',
      icon: '⚠️'
    },
    error: {
      bg: 'from-red-500/15 via-rose-500/15 to-red-500/15',
      border: 'border-red-500/40',
      text: 'text-red-200',
      icon: '🚨'
    },
    success: {
      bg: 'from-green-500/15 via-emerald-500/15 to-green-500/15',
      border: 'border-green-500/40',
      text: 'text-green-200',
      icon: '✅'
    }
  };

  const styles = typeStyles[notice.type];

  // Position notice right below the ticker (header + ticker heights)
  // EdgeToEdgeTicker positions: compact = top-12 sm:top-14, normal = top-14 sm:top-16
  // EdgeToEdgeTicker heights: compact = h-10, normal = h-12 sm:h-12
  // So notice should be: (ticker top) + (ticker height)
  const noticePosition = isCompact 
    ? 'top-[5.5rem] sm:top-[6rem]'  // (top-12 + h-10) = 3rem + 2.5rem, (top-14 + h-10) = 3.5rem + 2.5rem
    : 'top-[6.5rem] sm:top-[7rem]'; // (top-14 + h-12) = 3.5rem + 3rem, (top-16 + h-12) = 4rem + 3rem

  return (
    <div className={`fixed ${noticePosition} left-0 right-0 w-full z-30 transition-[top] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
      <div className={`w-full bg-gradient-to-r ${styles.bg} backdrop-blur-sm border-b ${styles.border}`}>
        <div className="w-full px-4 py-3">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex-shrink-0">
              <span className="text-lg">{styles.icon}</span>
            </div>
            
            <div className="text-center flex-1">
              <div className="hidden sm:block">
                <div className={`text-sm font-medium ${styles.text}`}>
                  {notice.title && <strong>{notice.title}: </strong>}{notice.message}
                </div>
              </div>
              
              <div className="block sm:hidden">
                <div className={`text-xs font-medium ${styles.text}`}>
                  {notice.title && <strong>{notice.title}: </strong>}{notice.message}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className={`flex-shrink-0 ${styles.text} opacity-60 hover:opacity-100 transition-opacity duration-200`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};