import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const BookKey = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="5" y="1" width="9" height="1" />
      <rect x="16" y="1" width="2" height="1" />
      <rect x="4" y="2" width="10" height="1" />
      <rect x="16" y="2" width="2" height="1" />
      <rect x="3" y="3" width="3" height="1" />
      <rect x="16" y="3" width="4" height="1" />
      <rect x="3" y="4" width="2" height="1" />
      <rect x="16" y="4" width="4" height="1" />
      <rect x="3" y="5" width="2" height="1" />
      <rect x="16" y="5" width="2" height="1" />
      <rect x="3" y="6" width="2" height="1" />
      <rect x="16" y="6" width="2" height="1" />
      <rect x="3" y="7" width="2" height="1" />
      <rect x="15" y="7" width="4" height="1" />
      <rect x="3" y="8" width="2" height="1" />
      <rect x="14" y="8" width="6" height="1" />
      <rect x="3" y="9" width="2" height="1" />
      <rect x="14" y="9" width="2" height="1" />
      <rect x="18" y="9" width="2" height="1" />
      <rect x="3" y="10" width="2" height="1" />
      <rect x="14" y="10" width="2" height="1" />
      <rect x="18" y="10" width="2" height="1" />
      <rect x="3" y="11" width="2" height="1" />
      <rect x="14" y="11" width="6" height="1" />
      <rect x="3" y="12" width="2" height="1" />
      <rect x="15" y="12" width="4" height="1" />
      <rect x="3" y="13" width="2" height="1" />
      <rect x="3" y="14" width="2" height="1" />
      <rect x="19" y="14" width="2" height="1" />
      <rect x="3" y="15" width="2" height="1" />
      <rect x="19" y="15" width="2" height="1" />
      <rect x="3" y="16" width="18" height="1" />
      <rect x="3" y="17" width="18" height="1" />
      <rect x="3" y="18" width="3" height="1" />
      <rect x="19" y="18" width="2" height="1" />
      <rect x="3" y="19" width="2" height="1" />
      <rect x="19" y="19" width="2" height="1" />
      <rect x="3" y="20" width="3" height="1" />
      <rect x="19" y="20" width="2" height="1" />
      <rect x="4" y="21" width="17" height="1" />
      <rect x="5" y="22" width="15" height="1" />
    </svg>
  )
);

BookKey.displayName = 'BookKey';

export default BookKey;
