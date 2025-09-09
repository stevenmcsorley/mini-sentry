declare module 'echarts-for-react' {
  import { Component } from 'react';
  import { EChartsOption } from 'echarts';

  interface ReactEChartsProps {
    option: EChartsOption;
    echarts?: any;
    style?: React.CSSProperties;
    className?: string;
    theme?: string | object;
    onChartReady?: (chartInstance: any) => void;
    showLoading?: boolean;
    loadingOption?: object;
    onEvents?: Record<string, Function>;
    opts?: {
      devicePixelRatio?: number;
      renderer?: 'canvas' | 'svg';
      width?: number | string;
      height?: number | string;
    };
  }

  export default class ReactECharts extends Component<ReactEChartsProps> {}
}

// ECharts module declarations
declare module 'echarts/core' {
  export const use: (components: any[]) => void;
  export const init: (dom: HTMLElement, theme?: string | object, opts?: any) => any;
  export const connect: (group: string | any[]) => void;
  export const disconnect: (group: string) => void;
  export const dispose: (target: any) => boolean;
  export const getInstanceByDom: (target: HTMLElement) => any;
  export const registerMap: (mapName: string, opt1: any, opt2?: any) => void;
  export const getMap: (mapName: string) => any;
  export const registerTheme: (name: string, theme: object) => void;
  export const graphic: any;
  export const util: any;
}

declare module 'echarts/charts' {
  export const LineChart: any;
  export const BarChart: any;
  export const PieChart: any;
  export const ScatterChart: any;
  export const RadarChart: any;
  export const MapChart: any;
  export const TreeChart: any;
  export const TreemapChart: any;
  export const GraphChart: any;
  export const GaugeChart: any;
  export const FunnelChart: any;
  export const ParallelChart: any;
  export const SankeyChart: any;
  export const BoxplotChart: any;
  export const CandlestickChart: any;
  export const EffectScatterChart: any;
  export const LinesChart: any;
  export const HeatmapChart: any;
  export const PictorialBarChart: any;
  export const ThemeRiverChart: any;
  export const SunburstChart: any;
  export const CustomChart: any;
}

declare module 'echarts/components' {
  export const GridComponent: any;
  export const PolarComponent: any;
  export const RadarComponent: any;
  export const GeoComponent: any;
  export const SingleAxisComponent: any;
  export const ParallelComponent: any;
  export const CalendarComponent: any;
  export const GraphicComponent: any;
  export const ToolboxComponent: any;
  export const TooltipComponent: any;
  export const AxisPointerComponent: any;
  export const LegendComponent: any;
  export const TitleComponent: any;
  export const MarkPointComponent: any;
  export const MarkLineComponent: any;
  export const MarkAreaComponent: any;
  export const TimelineComponent: any;
  export const DataZoomComponent: any;
  export const DataZoomInsideComponent: any;
  export const DataZoomSliderComponent: any;
  export const VisualMapComponent: any;
  export const VisualMapContinuousComponent: any;
  export const VisualMapPiecewiseComponent: any;
  export const AriaComponent: any;
  export const TransformComponent: any;
  export const BrushComponent: any;
}

declare module 'echarts/renderers' {
  export const CanvasRenderer: any;
  export const SVGRenderer: any;
}