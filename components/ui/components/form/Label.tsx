import { FC, ReactNode } from "react";

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

const Label: FC<LabelProps> = ({ htmlFor, children, className }) => {
  const baseClasses = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400";
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;
  
  return (
    <label
      htmlFor={htmlFor}
      className={combinedClasses}
    >
      {children}
    </label>
  );
};

export default Label;
