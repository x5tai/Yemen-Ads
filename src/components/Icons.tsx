import React from "react";
import * as LucideIcons from "lucide-react";

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className }) => {
  // Access the icon dynamically from the Lucide exports
  const IconComponent = (LucideIcons as any)[name];

  if (!IconComponent) {
    // Fallback to HelpCircle if icon is not found
    return <LucideIcons.HelpCircle className={className} />;
  }

  return <IconComponent className={className} />;
};
