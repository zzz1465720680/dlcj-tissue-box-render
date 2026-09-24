import type {SVGProps} from 'react';
type Props = SVGProps<SVGSVGElement> & {size?: number};
function Icon({size = 20, children, ...props}: Props) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>;
}
export const ArrowUpRight = (p: Props) => <Icon {...p}><path d="M6 18 18 6M6 6h12v12"/></Icon>;
export const ChevronRight = (p: Props) => <Icon {...p}><path d="m9 5 7 7-7 7"/></Icon>;
export const ArrowLeft = (p: Props) => <Icon {...p}><path d="m11 5-7 7 7 7M4 12h16"/></Icon>;
export const Check = (p: Props) => <Icon {...p}><path d="m5 12 4 4L19 6"/></Icon>;
export const MessageSquare = (p: Props) => <Icon {...p}><path d="M21 14a3 3 0 0 1-3 3H8l-5 4V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z"/><path d="M7 8h10M7 12h6"/></Icon>;
export const ClipboardCopy = (p: Props) => <Icon {...p}><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></Icon>;
export const Phone = (p: Props) => <Icon {...p}><path d="m8 3 3 5-3 3c1 2 3 4 5 5l3-3 5 3v3c0 2-3 2-5 1C9 18 4 13 3 7c-1-2 0-4 2-4z"/></Icon>;
