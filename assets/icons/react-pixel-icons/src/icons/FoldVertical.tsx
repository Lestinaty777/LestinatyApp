import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const FoldVertical = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="11" y="1" width="2" height="1" />
      <rect x="11" y="2" width="2" height="1" />
      <rect x="11" y="3" width="2" height="1" />
      <rect x="8" y="4" width="2" height="1" />
      <rect x="11" y="4" width="2" height="1" />
      <rect x="14" y="4" width="2" height="1" />
      <rect x="8" y="5" width="8" height="1" />
      <rect x="9" y="6" width="6" height="1" />
      <rect x="10" y="7" width="4" height="1" />
      <rect x="11" y="8" width="2" height="1" />
      <rect x="1" y="11" width="4" height="1" />
      <rect x="7" y="11" width="4" height="1" />
      <rect x="13" y="11" width="4" height="1" />
      <rect x="19" y="11" width="4" height="1" />
      <rect x="1" y="12" width="4" height="1" />
      <rect x="7" y="12" width="4" height="1" />
      <rect x="13" y="12" width="4" height="1" />
      <rect x="19" y="12" width="4" height="1" />
      <rect x="11" y="15" width="2" height="1" />
      <rect x="10" y="16" width="4" height="1" />
      <rect x="9" y="17" width="6" height="1" />
      <rect x="8" y="18" width="8" height="1" />
      <rect x="8" y="19" width="2" height="1" />
      <rect x="11" y="19" width="2" height="1" />
      <rect x="14" y="19" width="2" height="1" />
      <rect x="11" y="20" width="2" height="1" />
      <rect x="11" y="21" width="2" height="1" />
      <rect x="11" y="22" width="2" height="1" />
    </svg>
  )
);

FoldVertical.displayName = 'FoldVertical';

export default FoldVertical;
