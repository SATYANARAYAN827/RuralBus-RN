import { UserRole } from './index';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  group?: string;
}

export interface RoleNavigationConfig {
  role: UserRole;
  portalTitle: string;
  portalSubtitle: string;
  icon: string;
  roleBadge: string;
  roleBadgeColor: string;
  roleBadgeBg: string;
  items: NavItem[];
  bottomTabIds: string[];
}
