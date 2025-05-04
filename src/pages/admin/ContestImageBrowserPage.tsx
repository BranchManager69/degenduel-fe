// src/pages/admin/ContestImageBrowserPage.tsx
import React from "react";
import BasicPage from "../../components/templates/BasicPage";

export const ContestImageBrowserPage: React.FC = () => {
  // Sample data - in a real app, this would come from an API
  const sampleImages = [
    { id: 1, name: "Contest Banner 1", url: "https://placeholder.co/800x400/dark/light?text=Contest+Banner", type: "banner" },
    { id: 2, name: "Contest Card 1", url: "https://placeholder.co/400x400/dark/light?text=Contest+Card", type: "card" },
    { id: 3, name: "Contest Banner 2", url: "https://placeholder.co/800x400/dark/light?text=Contest+Banner+2", type: "banner" },
    { id: 4, name: "Contest Card 2", url: "https://placeholder.co/400x400/dark/light?text=Contest+Card+2", type: "card" },
  ];

  return (
    <BasicPage
      title="Contest Image Browser"
      description="Browse and manage contest images"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-md">
              Upload Image
            </button>
            <button className="bg-dark-300 hover:bg-dark-400 text-white px-4 py-2 rounded-md">
              Generate Image
            </button>
          </div>
          
          <div className="flex gap-2">
            <select className="bg-dark-200 border border-dark-300 text-white rounded-md px-3 py-2">
              <option value="all">All Types</option>
              <option value="banner">Banners</option>
              <option value="card">Cards</option>
            </select>
            <input 
              type="text" 
              placeholder="Search images..." 
              className="bg-dark-200 border border-dark-300 text-white rounded-md px-3 py-2"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleImages.map(image => (
            <div key={image.id} className="bg-dark-200/50 border border-dark-300 rounded-lg p-4 hover:border-brand-500/50 transition-colors">
              <div className="relative aspect-video mb-3 overflow-hidden rounded-md bg-dark-300/50">
                <img 
                  src={image.url} 
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-dark-800/80 text-xs text-white px-2 py-1 rounded-md">
                  {image.type}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-white">{image.name}</span>
                <div className="flex gap-1">
                  <button className="text-brand-400 hover:text-brand-300 p-1" title="Edit">✏️</button>
                  <button className="text-red-400 hover:text-red-300 p-1" title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BasicPage>
  );
};

export default ContestImageBrowserPage;
