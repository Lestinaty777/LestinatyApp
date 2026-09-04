import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Space = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="1" y="16" width="2" height="1" />
      <rect x="21" y="16" width="2" height="1" />
      <rect x="1" y="17" width="2" height="1" />
      <rect x="21" y="17" width="2" height="1" />
      <rect x="1" y="18" width="22" height="1" />
      <rect x="2" y="19" width="20" height="1" />
    </svg>
  )
);

Space.displayName = 'Space';

export default Space;
