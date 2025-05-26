// src/config/adminPages.ts
// Registry for admin pages - automatically used by dashboards

export interface AdminPageDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
  category: string;
  isNew?: boolean;
  superAdminOnly?: boolean;
}

export const adminPages: AdminPageDefinition[] = [
  // Existing pages can be registered here
  {
    id: "examplePage",
    title: "Example Page",
    description: "A demonstration of the template system",
    icon: "📄",
    path: "/admin/example",
    color: "brand",
    category: "Templates",
    isNew: true
  },
  
  // Auto-generated pages will be added below

  {
    id: "contestImageBrowser",
    title: "Contest Image Browser",
    description: "Browse and manage contest images",
    icon: "🖼️",
    path: "/admin/contest-image-browser",
    color: "brand",
    category: "Contest",
    isNew: true,
  },
  {
    id: "daddiosTest",
    title: "DADDIOS Test",
    description: "Test the new DADDIOS (Advanced Token Tracking Monitor) component",
    icon: "🔧",
    path: "/admin/token-sync-test",
    color: "brand",
    category: "Development",
    isNew: true,
  },];