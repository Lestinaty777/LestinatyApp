import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const SoapDispenserDroplet = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="5" y="1" width="10" height="1" />
      <rect x="4" y="2" width="11" height="1" />
      <rect x="4" y="3" width="2" height="1" />
      <rect x="9" y="3" width="3" height="1" />
      <rect x="4" y="4" width="2" height="1" />
      <rect x="9" y="4" width="3" height="1" />
      <rect x="8" y="5" width="5" height="1" />
      <rect x="7" y="6" width="7" height="1" />
      <rect x="7" y="7" width="2" height="1" />
      <rect x="12" y="7" width="2" height="1" />
      <rect x="7" y="8" width="2" height="1" />
      <rect x="12" y="8" width="2" height="1" />
      <rect x="4" y="9" width="10" height="1" />
      <rect x="3" y="10" width="11" height="1" />
      <rect x="16" y="10" width="2" height="1" />
      <rect x="3" y="11" width="2" height="1" />
      <rect x="16" y="11" width="2" height="1" />
      <rect x="3" y="12" width="2" height="1" />
      <rect x="15" y="12" width="4" height="1" />
      <rect x="3" y="13" width="2" height="1" />
      <rect x="14" y="13" width="6" height="1" />
      <rect x="3" y="14" width="2" height="1" />
      <rect x="13" y="14" width="3" height="1" />
      <rect x="18" y="14" width="3" height="1" />
      <rect x="3" y="15" width="2" height="1" />
      <rect x="13" y="15" width="2" height="1" />
      <rect x="18" y="15" width="3" height="1" />
      <rect x="3" y="16" width="2" height="1" />
      <rect x="12" y="16" width="3" height="1" />
      <rect x="19" y="16" width="3" height="1" />
      <rect x="3" y="17" width="2" height="1" />
      <rect x="12" y="17" width="2" height="1" />
      <rect x="20" y="17" width="2" height="1" />
      <rect x="3" y="18" width="2" height="1" />
      <rect x="12" y="18" width="2" height="1" />
      <rect x="20" y="18" width="2" height="1" />
      <rect x="3" y="19" width="2" height="1" />
      <rect x="12" y="19" width="3" height="1" />
      <rect x="19" y="19" width="3" height="1" />
      <rect x="3" y="20" width="8" height="1" />
      <rect x="13" y="20" width="3" height="1" />
      <rect x="18" y="20" width="3" height="1" />
      <rect x="4" y="21" width="7" height="1" />
      <rect x="13" y="21" width="8" height="1" />
      <rect x="15" y="22" width="4" height="1" />
    </svg>
  )
);

SoapDispenserDroplet.displayName = 'SoapDispenserDroplet';

export default SoapDispenserDroplet;
