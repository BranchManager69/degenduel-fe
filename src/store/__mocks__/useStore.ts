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