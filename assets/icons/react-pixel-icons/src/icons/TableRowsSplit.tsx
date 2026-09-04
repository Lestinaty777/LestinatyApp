import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const TableRowsSplit = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="2" y="1" width="2" height="1" />
      <rect x="8" y="1" width="2" height="1" />
      <rect x="14" y="1" width="2" height="1" />
      <rect x="20" y="1" width="2" height="1" />
      <rect x="2" y="2" width="2" height="1" />
      <rect x="8" y="2" width="2" height="1" />
      <rect x="14" y="2" width="2" height="1" />
      <rect x="20" y="2" width="2" height="1" />
      <rect x="2" y="3" width="2" height="1" />
      <rect x="8" y="3" width="2" height="1" />
      <rect x="14" y="3" width="2" height="1" />
      <rect x="20" y="3" width="2" height="1" />
      <rect x="2" y="4" width="2" height="1" />
      <rect x="8" y="4" width="2" height="1" />
      <rect x="14" y="4" width="2" height="1" />
      <rect x="20" y="4" width="2" height="1" />
      <rect x="2" y="5" width="20" height="1" />
      <rect x="3" y="6" width="18" height="1" />
      <rect x="1" y="9" width="4" height="1" />
      <rect x="7" y="9" width="4" height="1" />
      <rect x="13" y="9" width="4" height="1" />
      <rect x="19" y="9" width="4" height="1" />
      <rect x="1" y="10" width="4" height="1" />
      <rect x="7" y="10" width="4" height="1" />
      <rect x="13" y="10" width="4" height="1" />
      <rect x="19" y="10" width="4" height="1" />
      <rect x="3" y="13" width="18" height="1" />
      <rect x="2" y="14" width="20" height="1" />
      <rect x="2" y="15" width="2" height="1" />
      <rect x="8" y="15" width="2" height="1" />
      <rect x="14" y="15" width="2" height="1" />
      <rect x="20" y="15" width="2" height="1" />
      <rect x="2" y="16" width="2" height="1" />
      <rect x="8" y="16" width="2" height="1" />
      <rect x="14" y="16" width="2" height="1" />
      <rect x="20" y="16" width="2" height="1" />
      <rect x="2" y="17" width="2" height="1" />
      <rect x="8" y="17" width="2" height="1" />
      <rect x="14" y="17" width="2" height="1" />
      <rect x="20" y="17" width="2" height="1" />
      <rect x="2" y="18" width="20" height="1" />
      <rect x="2" y="19" width="20" height="1" />
      <rect x="2" y="20" width="2" height="1" />
      <rect x="8" y="20" width="2" height="1" />
      <rect x="14" y="20" width="2" height="1" />
      <rect x="20" y="20" width="2" height="1" />
      <rect x="2" y="21" width="2" height="1" />
      <rect x="8" y="21" width="2" height="1" />
      <rect x="14" y="21" width="2" height="1" />
      <rect x="20" y="21" width="2" height="1" />
      <rect x="2" y="22" width="2" height="1" />
      <rect x="8" y="22" width="2" height="1" />
      <rect x="14" y="22" width="2" height="1" />
      <rect x="20" y="22" width="2" height="1" />
    </svg>
  )
);

TableRowsSplit.displayName = 'TableRowsSplit';

export default TableRowsSplit;
