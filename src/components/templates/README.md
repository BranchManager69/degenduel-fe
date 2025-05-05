# Admin Page Templates

This system provides a simplified way to create new admin pages with automatic navigation integration.

## Features

- Quickly create new admin pages with a consistent design
- Automatically register pages in a central registry
- Pages will appear in admin dashboards without manual configuration
- Clean separation between page registration and UI components

## Creating a New Page

### Using the CLI Tool (Recommended)

1. Run the page generator script:
   ```bash
   npm run new:page
   ```

2. Follow the prompts to specify:
   - Page title
   - Description
   - Icon (emoji)
   - Category
   - Color theme
   - Whether it's for super admins only
   - Whether to mark it as new

3. The script will:
   - Create a new page file in `src/pages/admin/`
   - Register the page in `src/config/adminPages.ts`
   - Show you the next steps

4. Add your custom content to the created page file

### Manual Creation

1. Create a new page component:
   ```tsx
   // src/pages/admin/YourNewPage.tsx
   import React from "react";
   import BasicPage from "../../components/templates/BasicPage";

   export const YourNewPage: React.FC = () => {
     return (
       <BasicPage
         title="Your Page Title"
         description="Page description goes here"
       >
         {/* Your custom content here */}
       </BasicPage>
     );
   };

   export default YourNewPage;
   ```

2. Register the page in `src/config/adminPages.ts`:
   ```ts
   export const adminPages: AdminPageDefinition[] = [
     // Existing pages...
     
     {
       id: "yourPageId",
       title: "Your Page Title",
       description: "Page description goes here",
       icon: "🚀", // Using emoji
       path: "/admin/your-page-path",
       color: "brand", // Use a color from your theme
       category: "Your Category",
       isNew: true, // Optional, show "NEW" badge
       superAdminOnly: false, // Optional, limit to super admins
     },
   ];
   ```

3. Add a route in your router configuration:
   ```tsx
   <Route path="/admin/your-page-path" element={<YourNewPage />} />
   ```

## Using the PageRegistry Component

The `PageRegistrySection` component can be used to automatically display all registered pages:

```tsx
// Import the registry and components
import { adminPages, AdminPageDefinition } from "../../config/adminPages";
import { PageRegistrySection } from "../../components/templates";

// Group pages by category
function groupPagesByCategory(pages: AdminPageDefinition[]): Record<string, AdminPageDefinition[]> {
  return pages.reduce((acc, page) => {
    // Add filtering logic if needed
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, AdminPageDefinition[]>);
}

// In your component
const [selectedSection, setSelectedSection] = useState<string | null>(null);
const pagesByCategory = groupPagesByCategory(adminPages);

// Render each category
{Object.entries(pagesByCategory).map(([category, pages]) => (
  <PageRegistrySection 
    key={category}
    title={category} 
    pages={pages}
    selectedSection={selectedSection}
    setSelectedSection={setSelectedSection}
  />
))}
```

## Available Colors

These colors are configured to work with the design system:

- `brand`
- `cyber`
- `purple`
- `blue`
- `green`
- `red`
- `yellow`
- `indigo`
- `emerald`
- `amber`
- `pink`