"use client";

// Set minimale di icone SVG a tratto, coerenti (stroke 1.75, viewBox 20x20).
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };

function Svg({ children, size = 18, style, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ display: "block", flexShrink: 0, ...style }} {...base} {...rest}>
      {children}
    </svg>
  );
}

export const IconDashboard = (p) => <Svg {...p}><rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" /><rect x="11" y="2.5" width="6.5" height="4" rx="1.2" /><rect x="11" y="9" width="6.5" height="8.5" rx="1.2" /><rect x="2.5" y="11.5" width="6.5" height="6" rx="1.2" /></Svg>;
export const IconOwners = (p) => <Svg {...p}><circle cx="7" cy="6.5" r="2.75" /><path d="M2 17c0-2.9 2.2-5 5-5s5 2.1 5 5" /><circle cx="14.5" cy="7" r="2.1" /><path d="M12.7 12.2c.5-.15 1.1-.25 1.8-.25 2.5 0 4.5 1.9 4.5 4.6" /></Svg>;
export const IconProperties = (p) => <Svg {...p}><path d="M3 9.5 10 3l7 6.5" /><path d="M4.5 8.5V17h11V8.5" /><rect x="8.2" y="11.5" width="3.6" height="5.5" /></Svg>;
export const IconBookings = (p) => <Svg {...p}><rect x="2.5" y="3.8" width="15" height="13.4" rx="1.4" /><path d="M2.5 7.6h15" /><path d="M6.2 2.2v3.1M13.8 2.2v3.1" /><circle cx="6.6" cy="11.2" r=".9" fill="currentColor" stroke="none" /><circle cx="10" cy="11.2" r=".9" fill="currentColor" stroke="none" /><circle cx="13.4" cy="11.2" r=".9" fill="currentColor" stroke="none" /></Svg>;
export const IconGuests = (p) => <Svg {...p}><circle cx="10" cy="6.3" r="3.3" /><path d="M3.5 17c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" /></Svg>;
export const IconTasks = (p) => <Svg {...p}><rect x="3" y="3" width="14" height="14" rx="1.6" /><path d="m6.3 10 2.1 2.1 4.5-4.5" /></Svg>;
export const IconAccounting = (p) => <Svg {...p}><rect x="2.5" y="4.5" width="15" height="11" rx="1.6" /><path d="M2.5 8.2h15" /><circle cx="14" cy="12" r="1.4" /></Svg>;
export const IconTeam = (p) => <Svg {...p}><circle cx="6.6" cy="6" r="2.6" /><circle cx="14.2" cy="7.2" r="2.1" /><path d="M2 17c0-2.7 2.1-4.8 4.6-4.8S11.2 14.3 11.2 17" /><path d="M12.6 12.6c.4-.1.8-.15 1.3-.15 2.2 0 4 1.8 4 4.4" /></Svg>;
export const IconSearch = (p) => <Svg {...p}><circle cx="8.6" cy="8.6" r="5.6" /><path d="m17 17-4-4" /></Svg>;
export const IconBell = (p) => <Svg {...p}><path d="M5 8.2a5 5 0 0 1 10 0c0 4 1.5 5 1.5 5h-13s1.5-1 1.5-5Z" /><path d="M8.2 16.5a1.8 1.8 0 0 0 3.6 0" /></Svg>;
export const IconPlus = (p) => <Svg {...p}><path d="M10 3.5v13M3.5 10h13" /></Svg>;
export const IconChevronDown = (p) => <Svg {...p}><path d="m4.5 7.5 5.5 5.5 5.5-5.5" /></Svg>;
export const IconX = (p) => <Svg {...p}><path d="m4.5 4.5 11 11M15.5 4.5l-11 11" /></Svg>;
export const IconDrag = (p) => <Svg {...p}><circle cx="7" cy="5.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="7" cy="10" r="1.1" fill="currentColor" stroke="none" /><circle cx="7" cy="14.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="13" cy="5.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="13" cy="10" r="1.1" fill="currentColor" stroke="none" /><circle cx="13" cy="14.5" r="1.1" fill="currentColor" stroke="none" /></Svg>;
export const IconFilter = (p) => <Svg {...p}><path d="M3 4h14M6 10h8M8.5 16h3" /></Svg>;
export const IconDownload = (p) => <Svg {...p}><path d="M10 3v9.5M6 9l4 4 4-4" /><path d="M3.5 15.5v1.7h13v-1.7" /></Svg>;
export const IconTrash = (p) => <Svg {...p}><path d="M4 6h12M8 6V4.3c0-.5.4-.8.8-.8h2.4c.4 0 .8.3.8.8V6" /><path d="M5.3 6 6 16.2c0 .5.4.8.9.8h6.2c.5 0 .9-.3.9-.8L14.7 6" /></Svg>;
export const IconEdit = (p) => <Svg {...p}><path d="M12.5 3.5 16.5 7.5 7 17H3v-4L12.5 3.5Z" /></Svg>;
export const IconLogout = (p) => <Svg {...p}><path d="M8 17H4.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1H8" /><path d="M13 13.5 17 10l-4-3.5" /><path d="M17 10H7.5" /></Svg>;
export const IconTrendUp = (p) => <Svg {...p}><path d="m3 14 5-5 3.5 3.5L17 6" /><path d="M12.5 6H17v4.5" /></Svg>;
export const IconDots = (p) => <Svg {...p}><circle cx="10" cy="5" r="1.2" fill="currentColor" stroke="none" /><circle cx="10" cy="10" r="1.2" fill="currentColor" stroke="none" /><circle cx="10" cy="15" r="1.2" fill="currentColor" stroke="none" /></Svg>;
export const IconCheck = (p) => <Svg {...p}><path d="m4 10.5 4 4L16.5 5.5" /></Svg>;
export const IconClock = (p) => <Svg {...p}><circle cx="10" cy="10" r="7.2" /><path d="M10 6v4.2l3 2" /></Svg>;
export const IconArrowRight = (p) => <Svg {...p}><path d="M4 10h12M11 5.5 16.5 10l-5.5 4.5" /></Svg>;
export const IconCalendar = (p) => <Svg {...p}><rect x="2.5" y="3.8" width="15" height="13.4" rx="1.4" /><path d="M2.5 7.6h15" /><path d="M6.2 2.2v3.1M13.8 2.2v3.1" /></Svg>;
export const IconList = (p) => <Svg {...p}><path d="M7 5.5h10.5M7 10h10.5M7 14.5h10.5" /><circle cx="3" cy="5.5" r=".9" fill="currentColor" stroke="none" /><circle cx="3" cy="10" r=".9" fill="currentColor" stroke="none" /><circle cx="3" cy="14.5" r=".9" fill="currentColor" stroke="none" /></Svg>;
export const IconGrid = (p) => <Svg {...p}><rect x="2.7" y="2.7" width="6" height="6" rx="1" /><rect x="11.3" y="2.7" width="6" height="6" rx="1" /><rect x="2.7" y="11.3" width="6" height="6" rx="1" /><rect x="11.3" y="11.3" width="6" height="6" rx="1" /></Svg>;
export const IconSparkle = (p) => <Svg {...p}><path d="M10 2.5 11.3 8 17 10 11.3 12 10 17.5 8.7 12 3 10 8.7 8 10 2.5Z" /></Svg>;
export const IconHome = (p) => IconDashboard(p);
