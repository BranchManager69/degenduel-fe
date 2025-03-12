import { render, screen, fireEvent } from "@testing-library/react";
import { BanOnSightButton } from "./BanOnSightButton";

// We need to mock the BanUserModal because it contains API calls we don't want to trigger in tests
// This is a legitimate use of mocking - we're not testing the modal itself here
jest.mock("./BanUserModal", () => ({
  UserBanModal: ({ isOpen, onClose, onSuccess, mode }) => 
    isOpen ? (
      <div data-testid="mock-ban-modal">
        <div>Ban modal content for {mode}</div>
        <button onClick={() => {
          // This simulates the real component's behavior
          if (onSuccess) onSuccess();
          onClose();
        }}>
          Confirm
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
}));

// We need to mock the useAuth hook to test different permission scenarios
const mockIsAdmin = jest.fn();
const mockIsSuperAdmin = jest.fn();

jest.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    isAdmin: mockIsAdmin,
    isSuperAdmin: mockIsSuperAdmin,
  })
}));

describe("BanOnSightButton", () => {
  const mockUser = {
    wallet_address: "test-wallet",
    nickname: "TestUser",
    is_banned: false,
    role: "user"
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Default to admin permissions
    mockIsAdmin.mockReturnValue(true);
    mockIsSuperAdmin.mockReturnValue(false);
  });

  it("renders button variant correctly", () => {
    render(<BanOnSightButton user={mockUser} />);
    expect(screen.getByText("Ban on Sight")).toBeInTheDocument();
  });

  it("renders icon variant correctly", () => {
    render(<BanOnSightButton user={mockUser} variant="icon" />);
    const iconButton = screen.getByRole("button");
    expect(iconButton).toHaveAttribute("title", "Ban this user immediately");
  });

  it("opens ban modal when clicked", () => {
    render(<BanOnSightButton user={mockUser} />);
    fireEvent.click(screen.getByText("Ban on Sight"));
    expect(screen.getByTestId("mock-ban-modal")).toBeInTheDocument();
  });

  it("is disabled when user is already banned", () => {
    const bannedUser = { ...mockUser, is_banned: true };
    render(<BanOnSightButton user={bannedUser} />);
    expect(screen.getByText("Already Banned")).toBeDisabled();
  });

  it("calls onSuccess callback after successful ban confirmation", () => {
    const onSuccess = jest.fn();
    render(<BanOnSightButton user={mockUser} onSuccess={onSuccess} />);
    
    // Click the ban button to open modal
    fireEvent.click(screen.getByText("Ban on Sight"));
    
    // Click confirm to trigger the onSuccess callback
    fireEvent.click(screen.getByText("Confirm"));
    
    // Check if the onSuccess callback was called
    expect(onSuccess).toHaveBeenCalled();
  });

  it("doesn't show ban button when user is not an admin", () => {
    // Set up non-admin permissions
    mockIsAdmin.mockReturnValue(false);
    
    render(<BanOnSightButton user={mockUser} />);
    
    const button = screen.getByText("Ban on Sight");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("bg-dark-400");
  });

  it("prevents admins from banning superadmins", () => {
    // Setup admin permissions
    mockIsAdmin.mockReturnValue(true);
    mockIsSuperAdmin.mockReturnValue(false);
    
    const superAdminUser = { ...mockUser, role: "superadmin" };
    render(<BanOnSightButton user={superAdminUser} />);
    
    const button = screen.getByText("Ban on Sight");
    expect(button).toBeDisabled();
  });

  it("allows superadmins to ban admins", () => {
    // Setup superadmin permissions
    mockIsAdmin.mockReturnValue(true);
    mockIsSuperAdmin.mockReturnValue(true);
    
    const adminUser = { ...mockUser, role: "admin" };
    render(<BanOnSightButton user={adminUser} />);
    
    const button = screen.getByText("Ban on Sight");
    expect(button).not.toBeDisabled();
  });
});