import React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({
  className = "",
  children,
  ...props
}) => {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  );
};
