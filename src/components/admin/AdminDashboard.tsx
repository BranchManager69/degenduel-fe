import CircuitBreakerPanel from "./CircuitBreakerPanel";

// ... existing code ...

// Inside the AdminDashboard component's return statement, add:
<div className="space-y-8">
  <div className="bg-dark-400/50 rounded-lg p-6">
    <h2 className="text-2xl font-bold text-gray-200 mb-6">
      Service Health Monitor
    </h2>
    <CircuitBreakerPanel />
  </div>
  // ... existing dashboard content ...
</div>;

// ... rest of existing code ...
