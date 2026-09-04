import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const AlignHorizontalSpaceAround = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="3" y="1" width="2" height="1" />
      <rect x="19" y="1" width="2" height="1" />
      <rect x="3" y="2" width="2" height="1" />
      <rect x="19" y="2" width="2" height="1" />
      <rect x="3" y="3" width="2" height="1" />
      <rect x="19" y="3" width="2" height="1" />
      <rect x="3" y="4" width="2" height="1" />
      <rect x="19" y="4" width="2" height="1" />
      <rect x="3" y="5" width="2" height="1" />
      <rect x="19" y="5" width="2" height="1" />
      <rect x="3" y="6" width="2" height="1" />
      <rect x="9" y="6" width="6" height="1" />
      <rect x="19" y="6" width="2" height="1" />
      <rect x="3" y="7" width="2" height="1" />
      <rect x="8" y="7" width="8" height="1" />
      <rect x="19" y="7" width="2" height="1" />
      <rect x="3" y="8" width="2" height="1" />
      <rect x="8" y="8" width="2" height="1" />
      <rect x="14" y="8" width="2" height="1" />
      <rect x="19" y="8" width="2" height="1" />
      <rect x="3" y="9" width="2" height="1" />
      <rect x="8" y="9" width="2" height="1" />
      <rect x="14" y="9" width="2" height="1" />
      <rect x="19" y="9" width="2" height="1" />
      <rect x="3" y="10" width="2" height="1" />
      <rect x="8" y="10" width="2" height="1" />
      <rect x="14" y="10" width="2" height="1" />
      <rect x="19" y="10" width="2" height="1" />
      <rect x="3" y="11" width="2" height="1" />
      <rect x="8" y="11" width="2" height="1" />
      <rect x="14" y="11" width="2" height="1" />
      <rect x="19" y="11" width="2" height="1" />
      <rect x="3" y="12" width="2" height="1" />
      <rect x="8" y="12" width="2" height="1" />
      <rect x="14" y="12" width="2" height="1" />
      <rect x="19" y="12" width="2" height="1" />
      <rect x="3" y="13" width="2" height="1" />
      <rect x="8" y="13" width="2" height="1" />
      <rect x="14" y="13" width="2" height="1" />
      <rect x="19" y="13" width="2" height="1" />
      <rect x="3" y="14" width="2" height="1" />
      <rect x="8" y="14" width="2" height="1" />
      <rect x="14" y="14" width="2" height="1" />
      <rect x="19" y="14" width="2" height="1" />
      <rect x="3" y="15" width="2" height="1" />
      <rect x="8" y="15" width="2" height="1" />
      <rect x="14" y="15" width="2" height="1" />
      <rect x="19" y="15" width="2" height="1" />
      <rect x="3" y="16" width="2" height="1" />
      <rect x="8" y="16" width="8" height="1" />
      <rect x="19" y="16" width="2" height="1" />
      <rect x="3" y="17" width="2" height="1" />
      <rect x="9" y="17" width="6" height="1" />
      <rect x="19" y="17" width="2" height="1" />
      <rect x="3" y="18" width="2" height="1" />
      <rect x="19" y="18" width="2" height="1" />
      <rect x="3" y="19" width="2" height="1" />
      <rect x="19" y="19" width="2" height="1" />
      <rect x="3" y="20" width="2" height="1" />
      <rect x="19" y="20" width="2" height="1" />
      <rect x="3" y="21" width="2" height="1" />
      <rect x="19" y="21" width="2" height="1" />
      <rect x="3" y="22" width="2" height="1" />
      <rect x="19" y="22" width="2" height="1" />
    </svg>
  )
);

AlignHorizontalSpaceAround.displayName = 'AlignHorizontalSpaceAround';

export default AlignHorizontalSpaceAround;
