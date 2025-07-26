import { Pie90_10 } from '../atoms/Pie90_10';

export const Stage3 = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="text-center">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Step 3</p>
      <h3 className="step-label">Winners Paid</h3>
    </div>
    <div className="w-[260px] flex justify-center">
      <Pie90_10 />
    </div>
  </div>
);