import { useWallet } from "@aptos-labs/wallet-adapter-react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "../../hooks/useAuth";
import { useReferral } from "../../hooks/useReferral";
import { ReferralWelcomeModal } from "./ReferralWelcomeModal";

// Mock the hooks
jest.mock("../../hooks/useAuth");
jest.mock("../../hooks/useReferral");
jest.mock("@aptos-labs/wallet-adapter-react");

describe("ReferralWelcomeModal", () => {
  // Setup default mock values
  const mockSetShowWelcomeModal = jest.fn();
  const mockTrackConversion = jest.fn();
  const mockConnect = jest.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock useReferral hook
    (useReferral as jest.Mock).mockReturnValue({
      showWelcomeModal: true,
      setShowWelcomeModal: mockSetShowWelcomeModal,
      trackConversion: mockTrackConversion,
    });

    // Mock useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      isFullyConnected: () => false,
      user: null,
    });

    // Mock useWallet hook
    (useWallet as jest.Mock).mockReturnValue({
      connect: mockConnect,
      wallet: { name: "Petra" },
    });
  });

  it("renders welcome modal when showWelcomeModal is true", () => {
    render(<ReferralWelcomeModal />);

    expect(screen.getByText("Welcome to DegenDuel!")).toBeInTheDocument();
    expect(screen.getByText(/You've been invited/)).toBeInTheDocument();
  });

  it("closes modal when close button is clicked", () => {
    render(<ReferralWelcomeModal />);

    const closeButton = screen.getByText("×");
    userEvent.click(closeButton);

    expect(mockSetShowWelcomeModal).toHaveBeenCalledWith(false);
  });

  it("attempts to connect wallet when Get Started is clicked and user is not connected", () => {
    render(<ReferralWelcomeModal />);

    const getStartedButton = screen.getByText(/Get Started/i);
    userEvent.click(getStartedButton);

    expect(mockConnect).toHaveBeenCalledWith("Petra");
  });

  it("closes modal when Get Started is clicked and user is already connected", () => {
    (useAuth as jest.Mock).mockReturnValue({
      isFullyConnected: () => true,
      user: null,
    });

    render(<ReferralWelcomeModal />);

    const getStartedButton = screen.getByText(/Get Started/i);
    userEvent.click(getStartedButton);

    expect(mockSetShowWelcomeModal).toHaveBeenCalledWith(false);
  });

  it("tracks conversion and closes modal when user becomes connected", async () => {
    const { rerender } = render(<ReferralWelcomeModal />);

    // Update mock to simulate user connecting
    (useAuth as jest.Mock).mockReturnValue({
      isFullyConnected: () => true,
      user: { id: "1" },
    });

    // Rerender with new props
    rerender(<ReferralWelcomeModal />);

    await waitFor(() => {
      expect(mockTrackConversion).toHaveBeenCalled();
      expect(mockSetShowWelcomeModal).toHaveBeenCalledWith(false);
    });
  });
});
