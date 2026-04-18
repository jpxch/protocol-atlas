'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import type { ComposeOption } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import type { LineSeriesOption } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import type {
  GridComponentOption,
  TooltipComponentOption,
  LegendComponentOption,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { OpportunityFlowPoint } from '@/types/dashboard';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

type OpportunityFlowOption = ComposeOption<
  LineSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption
>;

interface OpportunityFlowChartProps {
  data: readonly OpportunityFlowPoint[];
}

export function OpportunityFlowChart({ data }: OpportunityFlowChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const chart = echarts.init(container, undefined, {
      renderer: 'canvas',
    });

    const option: OpportunityFlowOption = {
      animationDuration: 420,
      animationDurationUpdate: 320,
      color: ['#5aa7ff', '#7b8cff'],
      grid: {
        top: 24,
        right: 20,
        bottom: 48,
        left: 48,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(11, 14, 20, 0.96)',
        borderColor: 'rgba(120, 157, 218, 0.24)',
        borderWidth: 1,
        textStyle: {
          color: '#d4dbea',
        },
      },
      legend: {
        bottom: 10,
        left: 14,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: {
          color: '#8e9ab0',
          fontSize: 11,
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((point) => point.label),
        axisLine: {
          lineStyle: {
            color: 'rgba(111, 130, 161, 0.18)',
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#8e9ab0',
          fontSize: 11,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#667186',
          fontSize: 11,
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.06)',
          },
        },
      },
      series: [
        {
          name: 'Surfaced value',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 3,
          },
          areaStyle: {
            color: 'rgba(90, 167, 255, 0.14)',
          },
          data: data.map((point) => point.surfacedValue),
        },
        {
          name: 'Validated value',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 3,
          },
          areaStyle: {
            color: 'rgba(123, 140, 255, 0.10)',
          },
          data: data.map((point) => point.validatedValue),
        },
      ],
    };

    chart.setOption(option);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [data]);

  return <div ref={containerRef} className="atlas-chart-canvas" />;
}
