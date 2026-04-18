'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts/core';
import type { ComposeOption } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import type { BarSeriesOption } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import type { GridComponentOption, TooltipComponentOption } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ApiOpportunityRecord } from '@/types/api';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

type OpportunityChartOption = ComposeOption<
  BarSeriesOption | GridComponentOption | TooltipComponentOption
>;

interface OpportunityFlowChartProps {
  opportunities: readonly ApiOpportunityRecord[];
}

function parseUsd(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function OpportunityFlowChart({ opportunities }: OpportunityFlowChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const points = useMemo(() => {
    const totals = new Map<string, number>();

    for (const opportunity of opportunities) {
      const current = totals.get(opportunity.chain) ?? 0;
      totals.set(opportunity.chain, current + parseUsd(opportunity.money.netUsd));
    }

    return Array.from(totals.entries()).map(([label, value]) => ({
      label,
      value: Number(value.toFixed(2)),
    }));
  }, [opportunities]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || points.length === 0) {
      return;
    }

    const chart = echarts.init(container, undefined, {
      renderer: 'canvas',
    });

    const option: OpportunityChartOption = {
      animationDuration: 320,
      color: ['#5aa7ff'],
      grid: {
        top: 20,
        right: 20,
        bottom: 40,
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
      xAxis: {
        type: 'category',
        data: points.map((point) => point.label),
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
          name: 'Net USD',
          type: 'bar',
          barMaxWidth: 44,
          data: points.map((point) => point.value),
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
  }, [points]);

  if (points.length === 0) {
    return <div className="atlas-chart-empty">No persisted opportunities yet.</div>;
  }

  return <div ref={containerRef} className="atlas-chart-canvas" />;
}
