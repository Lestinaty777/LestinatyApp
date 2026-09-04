import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const GanttChart = React.forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="5" y="4" width="14" height="1" />
      <rect x="5" y="5" width="14" height="1" />
      <rect x="3" y="11" width="12" height="1" />
      <rect x="3" y="12" width="12" height="1" />
      <rect x="11" y="18" width="10" height="1" />
      <rect x="11" y="19" width="10" height="1" />
    </svg>
  )
);

GanttChart.displayName = 'GanttChart';

export default GanttChart;
