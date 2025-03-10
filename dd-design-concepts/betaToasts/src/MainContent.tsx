// Update all button classes to remove rounded corners
// Replace all instances of "rounded-lg" and "rounded-xl" with sharp edges
// For example, update the demo buttons:
<button
  onClick={() => addToast("success", "Position opened successfully", "Trade Executed")}
  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 font-medium text-white hover:opacity-90 transition-opacity"
>
  Success Toast
</button>
// And update the main action buttons:
<div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 p-[1px] overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.2)] group">
  {/* ... inner content ... */}
</div>