import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const Voicemail = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="4" y="7" width="4" height="1" />
      <rect x="16" y="7" width="4" height="1" />
      <rect x="2" y="8" width="8" height="1" />
      <rect x="14" y="8" width="8" height="1" />
      <rect x="2" y="9" width="3" height="1" />
      <rect x="7" y="9" width="3" height="1" />
      <rect x="14" y="9" width="3" height="1" />
      <rect x="19" y="9" width="3" height="1" />
      <rect x="1" y="10" width="2" height="1" />
      <rect x="9" y="10" width="2" height="1" />
      <rect x="13" y="10" width="2" height="1" />
      <rect x="21" y="10" width="2" height="1" />
      <rect x="1" y="11" width="2" height="1" />
      <rect x="9" y="11" width="2" height="1" />
      <rect x="13" y="11" width="2" height="1" />
      <rect x="21" y="11" width="2" height="1" />
      <rect x="1" y="12" width="2" height="1" />
      <rect x="9" y="12" width="2" height="1" />
      <rect x="13" y="12" width="2" height="1" />
      <rect x="21" y="12" width="2" height="1" />
      <rect x="1" y="13" width="2" height="1" />
      <rect x="9" y="13" width="2" height="1" />
      <rect x="13" y="13" width="2" height="1" />
      <rect x="21" y="13" width="2" height="1" />
      <rect x="2" y="14" width="3" height="1" />
      <rect x="7" y="14" width="3" height="1" />
      <rect x="14" y="14" width="3" height="1" />
      <rect x="19" y="14" width="3" height="1" />
      <rect x="2" y="15" width="20" height="1" />
      <rect x="4" y="16" width="16" height="1" />
    </svg>
  )
);

Voicemail.displayName = 'Voicemail';

export default Voicemail;
