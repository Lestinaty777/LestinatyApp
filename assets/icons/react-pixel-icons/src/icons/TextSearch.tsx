import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const TextSearch = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="2" y="4" width="20" height="1" />
      <rect x="2" y="5" width="20" height="1" />
      <rect x="2" y="11" width="9" height="1" />
      <rect x="15" y="11" width="4" height="1" />
      <rect x="2" y="12" width="9" height="1" />
      <rect x="14" y="12" width="6" height="1" />
      <rect x="13" y="13" width="3" height="1" />
      <rect x="18" y="13" width="3" height="1" />
      <rect x="13" y="14" width="2" height="1" />
      <rect x="19" y="14" width="2" height="1" />
      <rect x="13" y="15" width="2" height="1" />
      <rect x="19" y="15" width="2" height="1" />
      <rect x="13" y="16" width="3" height="1" />
      <rect x="18" y="16" width="3" height="1" />
      <rect x="14" y="17" width="7" height="1" />
      <rect x="2" y="18" width="9" height="1" />
      <rect x="15" y="18" width="7" height="1" />
      <rect x="2" y="19" width="9" height="1" />
      <rect x="20" y="19" width="2" height="1" />
    </svg>
  )
);

TextSearch.displayName = 'TextSearch';

export default TextSearch;
