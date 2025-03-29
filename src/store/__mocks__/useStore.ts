// Extend window interface if not already done in types/window.d.ts
declare global {
  interface Window {
    useStoreMock?: () => {
      maintenanceMode: boolean;
      setMaintenanceMode: (mode: boolean) => void;
    };
  }
}

// Mock implementation for useStore
export const useStore = () => {
  if (typeof window !== 'undefined' && window.useStoreMock) {
    return window.useStoreMock();
  }
  
  return {
    maintenanceMode: false,
    setMaintenanceMode: () => console.log('setMaintenanceMode called')
  };
};

export default useStore;