import React from "react";
import { Card } from "../ui/Card";

const OtherStuff: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">
        Additional Management Tools
      </h2>
      <div className="space-y-4">
        <div className="bg-dark-200 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-200 mb-2">
            System Status
          </h3>
          <p className="text-gray-400">All systems operational</p>
        </div>

        <div className="bg-dark-200 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-200 mb-2">
            Maintenance Mode
          </h3>
          <button className="bg-brand-500 text-white px-4 py-2 rounded hover:bg-brand-600 transition">
            Toggle Maintenance Mode
          </button>
        </div>

        <div className="bg-dark-200 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-200 mb-2">
            Cache Management
          </h3>
          <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
            Clear System Cache
          </button>
        </div>
      </div>
    </Card>
  );
};

export default OtherStuff;
