import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const EyeDashed = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="10" y="4" width="4" height="1" />
      <rect x="6" y="5" width="2" height="1" />
      <rect x="10" y="5" width="4" height="1" />
      <rect x="16" y="5" width="2" height="1" />
      <rect x="5" y="6" width="3" height="1" />
      <rect x="16" y="6" width="3" height="1" />
      <rect x="4" y="7" width="3" height="1" />
      <rect x="17" y="7" width="3" height="1" />
      <rect x="10" y="8" width="4" height="1" />
      <rect x="9" y="9" width="6" height="1" />
      <rect x="1" y="10" width="3" height="1" />
      <rect x="8" y="10" width="3" height="1" />
      <rect x="13" y="10" width="3" height="1" />
      <rect x="20" y="10" width="3" height="1" />
      <rect x="1" y="11" width="2" height="1" />
      <rect x="8" y="11" width="2" height="1" />
      <rect x="14" y="11" width="2" height="1" />
      <rect x="21" y="11" width="2" height="1" />
      <rect x="1" y="12" width="2" height="1" />
      <rect x="8" y="12" width="2" height="1" />
      <rect x="14" y="12" width="2" height="1" />
      <rect x="21" y="12" width="2" height="1" />
      <rect x="1" y="13" width="3" height="1" />
      <rect x="8" y="13" width="3" height="1" />
      <rect x="13" y="13" width="3" height="1" />
      <rect x="20" y="13" width="3" height="1" />
      <rect x="9" y="14" width="6" height="1" />
      <rect x="10" y="15" width="4" height="1" />
      <rect x="4" y="16" width="3" height="1" />
      <rect x="17" y="16" width="3" height="1" />
      <rect x="5" y="17" width="3" height="1" />
      <rect x="16" y="17" width="3" height="1" />
      <rect x="6" y="18" width="2" height="1" />
      <rect x="10" y="18" width="4" height="1" />
      <rect x="16" y="18" width="2" height="1" />
      <rect x="10" y="19" width="4" height="1" />
    </svg>
  )
);

EyeDashed.displayName = 'EyeDashed';

export default EyeDashed;
