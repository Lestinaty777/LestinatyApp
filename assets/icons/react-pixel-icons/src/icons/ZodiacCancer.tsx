import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const ZodiacCancer = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="8" y="2" width="8" height="1" />
      <rect x="6" y="3" width="12" height="1" />
      <rect x="4" y="4" width="5" height="1" />
      <rect x="15" y="4" width="4" height="1" />
      <rect x="3" y="5" width="6" height="1" />
      <rect x="17" y="5" width="2" height="1" />
      <rect x="3" y="6" width="7" height="1" />
      <rect x="2" y="7" width="3" height="1" />
      <rect x="8" y="7" width="3" height="1" />
      <rect x="2" y="8" width="2" height="1" />
      <rect x="9" y="8" width="2" height="1" />
      <rect x="2" y="9" width="2" height="1" />
      <rect x="9" y="9" width="2" height="1" />
      <rect x="2" y="10" width="2" height="1" />
      <rect x="9" y="10" width="2" height="1" />
      <rect x="15" y="10" width="5" height="1" />
      <rect x="2" y="11" width="3" height="1" />
      <rect x="8" y="11" width="3" height="1" />
      <rect x="14" y="11" width="7" height="1" />
      <rect x="3" y="12" width="7" height="1" />
      <rect x="13" y="12" width="3" height="1" />
      <rect x="19" y="12" width="3" height="1" />
      <rect x="4" y="13" width="5" height="1" />
      <rect x="13" y="13" width="2" height="1" />
      <rect x="20" y="13" width="2" height="1" />
      <rect x="13" y="14" width="2" height="1" />
      <rect x="20" y="14" width="2" height="1" />
      <rect x="13" y="15" width="2" height="1" />
      <rect x="20" y="15" width="2" height="1" />
      <rect x="13" y="16" width="3" height="1" />
      <rect x="19" y="16" width="3" height="1" />
      <rect x="14" y="17" width="7" height="1" />
      <rect x="5" y="18" width="2" height="1" />
      <rect x="15" y="18" width="6" height="1" />
      <rect x="5" y="19" width="4" height="1" />
      <rect x="15" y="19" width="5" height="1" />
      <rect x="6" y="20" width="12" height="1" />
      <rect x="8" y="21" width="8" height="1" />
    </svg>
  )
);

ZodiacCancer.displayName = 'ZodiacCancer';

export default ZodiacCancer;
