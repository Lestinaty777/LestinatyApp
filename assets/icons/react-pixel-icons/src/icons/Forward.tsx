import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Forward = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="14" y="6" width="2" height="1" />
      <rect x="14" y="7" width="3" height="1" />
      <rect x="15" y="8" width="3" height="1" />
      <rect x="16" y="9" width="3" height="1" />
      <rect x="17" y="10" width="3" height="1" />
      <rect x="6" y="11" width="15" height="1" />
      <rect x="4" y="12" width="17" height="1" />
      <rect x="4" y="13" width="3" height="1" />
      <rect x="17" y="13" width="3" height="1" />
      <rect x="3" y="14" width="3" height="1" />
      <rect x="16" y="14" width="3" height="1" />
      <rect x="3" y="15" width="2" height="1" />
      <rect x="15" y="15" width="3" height="1" />
      <rect x="3" y="16" width="2" height="1" />
      <rect x="14" y="16" width="3" height="1" />
      <rect x="3" y="17" width="2" height="1" />
      <rect x="14" y="17" width="2" height="1" />
      <rect x="3" y="18" width="2" height="1" />
    </svg>
  )
);

Forward.displayName = 'Forward';

export default Forward;
