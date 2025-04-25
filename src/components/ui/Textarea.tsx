import React, { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  className = "",
  ...props
}) => {
  return (
    <textarea
      className={`px-3 py-2 bg-dark-300 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
};
