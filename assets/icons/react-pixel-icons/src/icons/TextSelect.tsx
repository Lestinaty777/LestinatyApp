import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const TextSelect = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="3" y="2" width="3" height="1" />
      <rect x="8" y="2" width="3" height="1" />
      <rect x="13" y="2" width="3" height="1" />
      <rect x="18" y="2" width="3" height="1" />
      <rect x="2" y="3" width="4" height="1" />
      <rect x="8" y="3" width="3" height="1" />
      <rect x="13" y="3" width="3" height="1" />
      <rect x="18" y="3" width="4" height="1" />
      <rect x="2" y="4" width="2" height="1" />
      <rect x="20" y="4" width="2" height="1" />
      <rect x="2" y="5" width="2" height="1" />
      <rect x="20" y="5" width="2" height="1" />
      <rect x="6" y="7" width="10" height="1" />
      <rect x="2" y="8" width="2" height="1" />
      <rect x="6" y="8" width="10" height="1" />
      <rect x="20" y="8" width="2" height="1" />
      <rect x="2" y="9" width="2" height="1" />
      <rect x="20" y="9" width="2" height="1" />
      <rect x="2" y="10" width="2" height="1" />
      <rect x="20" y="10" width="2" height="1" />
      <rect x="6" y="11" width="12" height="1" />
      <rect x="6" y="12" width="12" height="1" />
      <rect x="2" y="13" width="2" height="1" />
      <rect x="20" y="13" width="2" height="1" />
      <rect x="2" y="14" width="2" height="1" />
      <rect x="20" y="14" width="2" height="1" />
      <rect x="2" y="15" width="2" height="1" />
      <rect x="6" y="15" width="8" height="1" />
      <rect x="20" y="15" width="2" height="1" />
      <rect x="6" y="16" width="8" height="1" />
      <rect x="2" y="18" width="2" height="1" />
      <rect x="20" y="18" width="2" height="1" />
      <rect x="2" y="19" width="2" height="1" />
      <rect x="20" y="19" width="2" height="1" />
      <rect x="2" y="20" width="4" height="1" />
      <rect x="8" y="20" width="3" height="1" />
      <rect x="13" y="20" width="3" height="1" />
      <rect x="18" y="20" width="4" height="1" />
      <rect x="3" y="21" width="3" height="1" />
      <rect x="8" y="21" width="3" height="1" />
      <rect x="13" y="21" width="3" height="1" />
      <rect x="18" y="21" width="3" height="1" />
    </svg>
  )
);

TextSelect.displayName = 'TextSelect';

export default TextSelect;
