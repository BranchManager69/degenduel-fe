import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./AdminRoute";

// Mock the useAuth hook to test different scenarios
const mockIsAdmin = jest.fn();

jest.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { role: "admin" }, // Provide a mock user
    loading: false,          // Not loading
    isAdmin: mockIsAdmin,    // Mock the isAdmin function
  }),
}));

describe("AdminRoute component", () => {
  const TestComponent = () => <div>Protected Admin Content</div>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const renderAdminRoute = () => {
    return render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminRoute><TestComponent /></AdminRoute>} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders children when user is an admin", () => {
    // Set up admin user
    mockIsAdmin.mockReturnValue(true);
    
    renderAdminRoute();
    
    // Admin content should be visible
    expect(screen.getByText("Protected Admin Content")).toBeInTheDocument();
  });

  it("redirects to home when user is not an admin", () => {
    // Set up non-admin user
    mockIsAdmin.mockReturnValue(false);
    
    renderAdminRoute();
    
    // Should redirect to home page
    expect(screen.getByText("Home Page")).toBeInTheDocument();
    // Admin content should not be visible
    expect(screen.queryByText("Protected Admin Content")).not.toBeInTheDocument();
  });
});