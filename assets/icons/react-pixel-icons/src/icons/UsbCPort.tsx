import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const UsbCPort = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="4" y="7" width="16" height="1" />
      <rect x="2" y="8" width="19" height="1" />
      <rect x="2" y="9" width="3" height="1" />
      <rect x="19" y="9" width="3" height="1" />
      <rect x="1" y="10" width="3" height="1" />
      <rect x="20" y="10" width="3" height="1" />
      <rect x="1" y="11" width="2" height="1" />
      <rect x="5" y="11" width="14" height="1" />
      <rect x="21" y="11" width="2" height="1" />
      <rect x="1" y="12" width="2" height="1" />
      <rect x="5" y="12" width="14" height="1" />
      <rect x="21" y="12" width="2" height="1" />
      <rect x="1" y="13" width="3" height="1" />
      <rect x="20" y="13" width="3" height="1" />
      <rect x="2" y="14" width="3" height="1" />
      <rect x="19" y="14" width="3" height="1" />
      <rect x="3" y="15" width="19" height="1" />
      <rect x="4" y="16" width="16" height="1" />
    </svg>
  )
);

UsbCPort.displayName = 'UsbCPort';

export default UsbCPort;
