import { render, screen } from "@testing-library/react";

import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default size", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("h-8 w-8"); // Default size
  });

  it("renders with small size", () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("h-4 w-4");
  });

  it("renders with large size", () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("h-12 w-12");
  });

  it("applies custom classes", () => {
    render(<LoadingSpinner className="text-red-500" />);
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("text-red-500");
  });
});
