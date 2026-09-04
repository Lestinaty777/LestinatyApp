import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const GitCommitHorizontal = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="10" y="8" width="4" height="1" />
      <rect x="9" y="9" width="6" height="1" />
      <rect x="8" y="10" width="3" height="1" />
      <rect x="13" y="10" width="3" height="1" />
      <rect x="2" y="11" width="8" height="1" />
      <rect x="14" y="11" width="8" height="1" />
      <rect x="2" y="12" width="8" height="1" />
      <rect x="14" y="12" width="8" height="1" />
      <rect x="8" y="13" width="3" height="1" />
      <rect x="13" y="13" width="3" height="1" />
      <rect x="9" y="14" width="6" height="1" />
      <rect x="10" y="15" width="4" height="1" />
    </svg>
  )
);

GitCommitHorizontal.displayName = 'GitCommitHorizontal';

export default GitCommitHorizontal;
