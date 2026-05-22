import { useMediaQuery } from '../../hooks/useMediaQuery'
import { MobileShell } from './MobileShell'
import { DesktopShell } from './DesktopShell'

export function AppShell() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  return isMobile ? <MobileShell /> : <DesktopShell />
}
