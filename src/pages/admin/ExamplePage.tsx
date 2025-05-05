// src/pages/admin/ExamplePage.tsx
import React from "react";
import BasicPage from "../../components/templates/BasicPage";

export const ExamplePage: React.FC = () => {
  return (
    <BasicPage
      title="Example Page"
      description="A demonstration of the template system"
    >
      <div className="space-y-6">
        <p className="text-gray-300">
          This is an example page created with the BasicPage template.
        </p>
        
        <div className="bg-dark-300/30 p-4 rounded-lg border border-brand-500/20">
          <h3 className="font-bold text-lg text-brand-300 mb-2">How to Create New Pages</h3>
          <ol className="list-decimal list-inside text-gray-300 space-y-2">
            <li>Run <code className="bg-dark-300/50 px-2 rounded">npm run new-page</code> from the command line</li>
            <li>Follow the prompts to generate a new page</li>
            <li>The page will be automatically added to the admin registry</li>
            <li>Add your custom content to the page file</li>
          </ol>
        </div>
      </div>
    </BasicPage>
  );
};

export default ExamplePage;