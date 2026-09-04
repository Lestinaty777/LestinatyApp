import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const AlignEndVertical = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="21" y="1" width="2" height="1" />
      <rect x="21" y="2" width="2" height="1" />
      <rect x="2" y="3" width="16" height="1" />
      <rect x="21" y="3" width="2" height="1" />
      <rect x="1" y="4" width="18" height="1" />
      <rect x="21" y="4" width="2" height="1" />
      <rect x="1" y="5" width="2" height="1" />
      <rect x="17" y="5" width="2" height="1" />
      <rect x="21" y="5" width="2" height="1" />
      <rect x="1" y="6" width="2" height="1" />
      <rect x="17" y="6" width="2" height="1" />
      <rect x="21" y="6" width="2" height="1" />
      <rect x="1" y="7" width="2" height="1" />
      <rect x="17" y="7" width="2" height="1" />
      <rect x="21" y="7" width="2" height="1" />
      <rect x="1" y="8" width="2" height="1" />
      <rect x="17" y="8" width="2" height="1" />
      <rect x="21" y="8" width="2" height="1" />
      <rect x="1" y="9" width="18" height="1" />
      <rect x="21" y="9" width="2" height="1" />
      <rect x="2" y="10" width="16" height="1" />
      <rect x="21" y="10" width="2" height="1" />
      <rect x="21" y="11" width="2" height="1" />
      <rect x="21" y="12" width="2" height="1" />
      <rect x="9" y="13" width="9" height="1" />
      <rect x="21" y="13" width="2" height="1" />
      <rect x="8" y="14" width="11" height="1" />
      <rect x="21" y="14" width="2" height="1" />
      <rect x="8" y="15" width="2" height="1" />
      <rect x="17" y="15" width="2" height="1" />
      <rect x="21" y="15" width="2" height="1" />
      <rect x="8" y="16" width="2" height="1" />
      <rect x="17" y="16" width="2" height="1" />
      <rect x="21" y="16" width="2" height="1" />
      <rect x="8" y="17" width="2" height="1" />
      <rect x="17" y="17" width="2" height="1" />
      <rect x="21" y="17" width="2" height="1" />
      <rect x="8" y="18" width="2" height="1" />
      <rect x="17" y="18" width="2" height="1" />
      <rect x="21" y="18" width="2" height="1" />
      <rect x="8" y="19" width="11" height="1" />
      <rect x="21" y="19" width="2" height="1" />
      <rect x="9" y="20" width="9" height="1" />
      <rect x="21" y="20" width="2" height="1" />
      <rect x="21" y="21" width="2" height="1" />
      <rect x="21" y="22" width="2" height="1" />
    </svg>
  )
);

AlignEndVertical.displayName = 'AlignEndVertical';

export default AlignEndVertical;
