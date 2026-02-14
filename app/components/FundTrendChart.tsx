'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TooltipComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { TrendPoint } from '../types';

echarts.use([TooltipComponent, GridComponent, LineChart, CanvasRenderer]);

interface FundTrendChartProps {
  data: TrendPoint[];
}

export default function FundTrendChart({ data }: FundTrendChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!Array.isArray(data) || data.length < 2) return;
    if (!chartRef.current) return;

    let destroyed = false;

    if (instanceRef.current) {
      instanceRef.current.dispose();
      instanceRef.current = null;
    }

    const el = chartRef.current;
    const chart = echarts.init(el);
    instanceRef.current = chart;

    const ys = data
      .map((d) => Number(d.y))
      .filter((v) => Number.isFinite(v));
    if (ys.length < 2) return;

    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const lastPoint = data[data.length - 1] || ({} as TrendPoint);
    const lastChange = Number(lastPoint.equityReturn);
    const isUp = lastChange > 0;
    const isDown = lastChange < 0;
    const colorUp = '#ff4d4f';
    const colorDown = '#52c41a';
    const colorFlat = '#999999';
    const lineColor = isUp ? colorUp : isDown ? colorDown : colorFlat;

    const option = {
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        formatter(params: any) {
          const p = params && params[0];
          if (!p) return '';
          const date = new Date(p.value[0]);
          const d =
            Number.isFinite(date.getTime()) &&
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
              2,
              '0'
            )}-${String(date.getDate()).padStart(2, '0')}`;
          return `${d || ''}<br/>净值：${p.value[1]}`;
        },
      },
      grid: {
        left: 8,
        right: 8,
        top: 10,
        bottom: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLine: { show: true, lineStyle: { color: '#e5e5e5' } },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          color: '#999',
          fontSize: 10,
          formatter: (value: number) => {
            const d = new Date(value);
            return `${d.getMonth() + 1}-${d.getDate()}`;
          },
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        scale: true,
        min: (value: { min: number }) => Math.floor(value.min * 1000) / 1000,
        max: (value: { max: number }) => Math.ceil(value.max * 1000) / 1000,
        axisLine: { show: true, lineStyle: { color: '#e5e5e5' } },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          color: '#999',
          fontSize: 10,
          formatter: (val: number) => val.toFixed(3)
        },
        splitLine: {
          show: true,
          lineStyle: { color: 'rgba(0,0,0,0.05)', type: 'dashed' }
        },
      },
      series: [
        {
          type: 'line',
          symbol: 'none',
          smooth: true,
          lineStyle: {
            width: 1.5,
            color: lineColor,
          },
          areaStyle: {
            opacity: 0.1,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: lineColor },
              { offset: 1, color: 'rgba(255, 255, 255, 0)' }
            ])
          },
          data: data.map((d) => [d.x, Number(d.y)]),
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => {
        chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      destroyed = true;
      window.removeEventListener('resize', handleResize);
      if (instanceRef.current) {
        instanceRef.current.dispose();
        instanceRef.current = null;
      }
    };
  }, [data]);

  if (!Array.isArray(data) || data.length < 2) return null;

  return (
    <div
      className="fund-trend-chart"
      ref={chartRef}
      style={{
        width: '100%',
        height: 180,
      }}
    />
  );
}
