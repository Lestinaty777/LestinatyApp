import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const AlignVerticalSpaceAround = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="1" y="3" width="22" height="1" />
      <rect x="1" y="4" width="22" height="1" />
      <rect x="7" y="8" width="10" height="1" />
      <rect x="6" y="9" width="12" height="1" />
      <rect x="6" y="10" width="2" height="1" />
      <rect x="16" y="10" width="2" height="1" />
      <rect x="6" y="11" width="2" height="1" />
      <rect x="16" y="11" width="2" height="1" />
      <rect x="6" y="12" width="2" height="1" />
      <rect x="16" y="12" width="2" height="1" />
      <rect x="6" y="13" width="2" height="1" />
      <rect x="16" y="13" width="2" height="1" />
      <rect x="6" y="14" width="12" height="1" />
      <rect x="7" y="15" width="10" height="1" />
      <rect x="1" y="19" width="22" height="1" />
      <rect x="1" y="20" width="22" height="1" />
    </svg>
  )
);

AlignVerticalSpaceAround.displayName = 'AlignVerticalSpaceAround';

export default AlignVerticalSpaceAround;
