import type { ComponentType } from 'react';

export interface IconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

// Helper type for sidebar items that use both Lucide and custom icons
export type IconComponent = ComponentType<IconProps>;
