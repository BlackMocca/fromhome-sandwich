import { toggleMobileSidebar, closeMobileSidebar } from './sidebar';
export { toggleMobileSidebar, closeMobileSidebar };

import ManagementSidebar from './sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ManagementSidebar>{children}</ManagementSidebar>;
}
