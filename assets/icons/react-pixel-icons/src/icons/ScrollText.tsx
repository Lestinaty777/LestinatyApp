import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const ScrollText = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="2" y="2" width="17" height="1" />
      <rect x="1" y="3" width="19" height="1" />
      <rect x="1" y="4" width="2" height="1" />
      <rect x="5" y="4" width="2" height="1" />
      <rect x="18" y="4" width="2" height="1" />
      <rect x="1" y="5" width="2" height="1" />
      <rect x="5" y="5" width="2" height="1" />
      <rect x="18" y="5" width="2" height="1" />
      <rect x="1" y="6" width="2" height="1" />
      <rect x="5" y="6" width="2" height="1" />
      <rect x="18" y="6" width="2" height="1" />
      <rect x="1" y="7" width="6" height="1" />
      <rect x="9" y="7" width="7" height="1" />
      <rect x="18" y="7" width="2" height="1" />
      <rect x="2" y="8" width="5" height="1" />
      <rect x="9" y="8" width="7" height="1" />
      <rect x="18" y="8" width="2" height="1" />
      <rect x="5" y="9" width="2" height="1" />
      <rect x="18" y="9" width="2" height="1" />
      <rect x="5" y="10" width="2" height="1" />
      <rect x="18" y="10" width="2" height="1" />
      <rect x="5" y="11" width="2" height="1" />
      <rect x="9" y="11" width="7" height="1" />
      <rect x="18" y="11" width="2" height="1" />
      <rect x="5" y="12" width="2" height="1" />
      <rect x="9" y="12" width="7" height="1" />
      <rect x="18" y="12" width="2" height="1" />
      <rect x="5" y="13" width="2" height="1" />
      <rect x="18" y="13" width="2" height="1" />
      <rect x="5" y="14" width="2" height="1" />
      <rect x="18" y="14" width="2" height="1" />
      <rect x="5" y="15" width="2" height="1" />
      <rect x="18" y="15" width="2" height="1" />
      <rect x="5" y="16" width="2" height="1" />
      <rect x="10" y="16" width="12" height="1" />
      <rect x="5" y="17" width="2" height="1" />
      <rect x="9" y="17" width="14" height="1" />
      <rect x="5" y="18" width="2" height="1" />
      <rect x="9" y="18" width="2" height="1" />
      <rect x="21" y="18" width="2" height="1" />
      <rect x="5" y="19" width="2" height="1" />
      <rect x="9" y="19" width="2" height="1" />
      <rect x="21" y="19" width="2" height="1" />
      <rect x="5" y="20" width="18" height="1" />
      <rect x="6" y="21" width="16" height="1" />
    </svg>
  )
);

ScrollText.displayName = 'ScrollText';

export default ScrollText;
