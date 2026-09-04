import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Combine = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="3" y="2" width="7" height="1" />
      <rect x="13" y="2" width="2" height="1" />
      <rect x="18" y="2" width="2" height="1" />
      <rect x="2" y="3" width="9" height="1" />
      <rect x="13" y="3" width="3" height="1" />
      <rect x="18" y="3" width="3" height="1" />
      <rect x="2" y="4" width="2" height="1" />
      <rect x="9" y="4" width="2" height="1" />
      <rect x="14" y="4" width="2" height="1" />
      <rect x="19" y="4" width="2" height="1" />
      <rect x="2" y="5" width="2" height="1" />
      <rect x="9" y="5" width="2" height="1" />
      <rect x="14" y="5" width="2" height="1" />
      <rect x="19" y="5" width="2" height="1" />
      <rect x="2" y="6" width="2" height="1" />
      <rect x="9" y="6" width="2" height="1" />
      <rect x="14" y="6" width="2" height="1" />
      <rect x="19" y="6" width="2" height="1" />
      <rect x="2" y="7" width="2" height="1" />
      <rect x="9" y="7" width="2" height="1" />
      <rect x="14" y="7" width="2" height="1" />
      <rect x="19" y="7" width="2" height="1" />
      <rect x="2" y="8" width="2" height="1" />
      <rect x="9" y="8" width="2" height="1" />
      <rect x="14" y="8" width="2" height="1" />
      <rect x="19" y="8" width="2" height="1" />
      <rect x="2" y="9" width="9" height="1" />
      <rect x="13" y="9" width="3" height="1" />
      <rect x="18" y="9" width="3" height="1" />
      <rect x="3" y="10" width="7" height="1" />
      <rect x="13" y="10" width="2" height="1" />
      <rect x="18" y="10" width="2" height="1" />
      <rect x="2" y="13" width="2" height="1" />
      <rect x="14" y="13" width="7" height="1" />
      <rect x="2" y="14" width="2" height="1" />
      <rect x="6" y="14" width="2" height="1" />
      <rect x="13" y="14" width="9" height="1" />
      <rect x="2" y="15" width="2" height="1" />
      <rect x="6" y="15" width="3" height="1" />
      <rect x="13" y="15" width="2" height="1" />
      <rect x="20" y="15" width="2" height="1" />
      <rect x="2" y="16" width="2" height="1" />
      <rect x="7" y="16" width="3" height="1" />
      <rect x="13" y="16" width="2" height="1" />
      <rect x="20" y="16" width="2" height="1" />
      <rect x="2" y="17" width="9" height="1" />
      <rect x="13" y="17" width="2" height="1" />
      <rect x="20" y="17" width="2" height="1" />
      <rect x="3" y="18" width="8" height="1" />
      <rect x="13" y="18" width="2" height="1" />
      <rect x="20" y="18" width="2" height="1" />
      <rect x="7" y="19" width="3" height="1" />
      <rect x="13" y="19" width="2" height="1" />
      <rect x="20" y="19" width="2" height="1" />
      <rect x="6" y="20" width="3" height="1" />
      <rect x="13" y="20" width="9" height="1" />
      <rect x="6" y="21" width="2" height="1" />
      <rect x="14" y="21" width="7" height="1" />
    </svg>
  )
);

Combine.displayName = 'Combine';

export default Combine;
