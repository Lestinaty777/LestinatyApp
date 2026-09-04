import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const CalendarClock = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, color = '#111111', ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="7" y="1" width="2" height="1" />
      <rect x="15" y="1" width="2" height="1" />
      <rect x="3" y="2" width="18" height="1" />
      <rect x="2" y="3" width="20" height="1" />
      <rect x="2" y="4" width="2" height="1" />
      <rect x="7" y="4" width="2" height="1" />
      <rect x="15" y="4" width="2" height="1" />
      <rect x="20" y="4" width="2" height="1" />
      <rect x="2" y="5" width="2" height="1" />
      <rect x="7" y="5" width="2" height="1" />
      <rect x="15" y="5" width="2" height="1" />
      <rect x="20" y="5" width="2" height="1" />
      <rect x="2" y="6" width="2" height="1" />
      <rect x="20" y="6" width="2" height="1" />
      <rect x="2" y="7" width="2" height="1" />
      <rect x="20" y="7" width="2" height="1" />
      <rect x="2" y="8" width="8" height="1" />
      <rect x="2" y="9" width="8" height="1" />
      <rect x="13" y="9" width="6" height="1" />
      <rect x="2" y="10" width="2" height="1" />
      <rect x="12" y="10" width="8" height="1" />
      <rect x="2" y="11" width="2" height="1" />
      <rect x="11" y="11" width="3" height="1" />
      <rect x="18" y="11" width="3" height="1" />
      <rect x="2" y="12" width="2" height="1" />
      <rect x="10" y="12" width="3" height="1" />
      <rect x="19" y="12" width="3" height="1" />
      <rect x="2" y="13" width="2" height="1" />
      <rect x="9" y="13" width="3" height="1" />
      <rect x="15" y="13" width="2" height="1" />
      <rect x="20" y="13" width="3" height="1" />
      <rect x="2" y="14" width="2" height="1" />
      <rect x="9" y="14" width="2" height="1" />
      <rect x="15" y="14" width="2" height="1" />
      <rect x="21" y="14" width="2" height="1" />
      <rect x="2" y="15" width="2" height="1" />
      <rect x="9" y="15" width="2" height="1" />
      <rect x="15" y="15" width="2" height="1" />
      <rect x="21" y="15" width="2" height="1" />
      <rect x="2" y="16" width="2" height="1" />
      <rect x="9" y="16" width="2" height="1" />
      <rect x="15" y="16" width="3" height="1" />
      <rect x="21" y="16" width="2" height="1" />
      <rect x="2" y="17" width="2" height="1" />
      <rect x="9" y="17" width="2" height="1" />
      <rect x="16" y="17" width="3" height="1" />
      <rect x="21" y="17" width="2" height="1" />
      <rect x="2" y="18" width="2" height="1" />
      <rect x="9" y="18" width="3" height="1" />
      <rect x="20" y="18" width="3" height="1" />
      <rect x="2" y="19" width="2" height="1" />
      <rect x="10" y="19" width="3" height="1" />
      <rect x="19" y="19" width="3" height="1" />
      <rect x="2" y="20" width="6" height="1" />
      <rect x="11" y="20" width="3" height="1" />
      <rect x="18" y="20" width="3" height="1" />
      <rect x="3" y="21" width="5" height="1" />
      <rect x="12" y="21" width="8" height="1" />
      <rect x="13" y="22" width="6" height="1" />
    </svg>
  )
);

CalendarClock.displayName = 'CalendarClock';

export default CalendarClock;
