import React from "react";
import toast from "react-hot-toast";

interface CopyToClipboardProps {
  text: string;
  className?: string;
  children?: React.ReactNode;
}

export const CopyToClipboard: React.FC<CopyToClipboardProps> = ({
  text,
  className = "",
  children,
}) => {
  const handleClick = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Copied to clipboard!", {
          duration: 2000,
          position: "bottom-right",
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #262626",
          },
          icon: "📋",
        });
      })
      .catch((error) => {
        console.error("Failed to copy:", error);
        toast.error("Failed to copy to clipboard", {
          duration: 2000,
          position: "bottom-right",
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #262626",
          },
        });
      });
  };

  return (
    <div onClick={handleClick} className={`cursor-pointer ${className}`}>
      {children || text}
    </div>
  );
};
