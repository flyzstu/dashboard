import EChart from './EChart.js';
import { useDashboardStore } from '../services/dashboardStore.js';

const { computed } = window.Vue;

export default {
  name: 'NetworkTraffic',
  components: { EChart },
  template: `
    <EChart :option="option" height="280px" />
  `,
  setup() {
    const store = useDashboardStore();

    const option = computed(() => {
      const labels = Array.isArray(store.networkTraffic?.labels) ? store.networkTraffic.labels : [];
      const inbound = Array.isArray(store.networkTraffic?.inbound) ? store.networkTraffic.inbound : [];
      const outbound = Array.isArray(store.networkTraffic?.outbound) ? store.networkTraffic.outbound : [];

      const size = Math.max(labels.length, inbound.length, outbound.length, 1);
      const chartLabels = [];
      const inboundSeries = [];
      const outboundSeries = [];

      for (let i = 0; i < size; i += 1) {
        chartLabels.push(labels[i] ?? '');
        inboundSeries.push(inbound[i] ?? 0);
        outboundSeries.push(outbound[i] ?? 0);
      }

      return {
        grid: { left: 40, right: 20, top: 24, bottom: 28 },
        tooltip: { trigger: 'axis' },
        legend: {
          data: ['入站 (MB/s)', '出站 (MB/s)'],
          top: 2,
          textStyle: { color: '#cfe6ff' },
        },
        xAxis: {
          type: 'category',
          data: chartLabels,
          boundaryGap: false,
          axisLabel: { color: '#89a1c1' },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        },
        yAxis: {
          type: 'value',
          name: 'MB/s',
          axisLabel: { color: '#89a1c1' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        },
        series: [
          {
            name: '入站 (MB/s)',
            type: 'line',
            smooth: true,
            showSymbol: false,
            emphasis: { focus: 'series' },
            lineStyle: { color: '#4cc9f0', width: 2 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(76,201,240,0.35)' },
                  { offset: 1, color: 'rgba(76,201,240,0.02)' },
                ],
              },
            },
            data: inboundSeries,
          },
          {
            name: '出站 (MB/s)',
            type: 'line',
            smooth: true,
            showSymbol: false,
            emphasis: { focus: 'series' },
            lineStyle: { color: '#80ffdb', width: 2 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(128,255,219,0.30)' },
                  { offset: 1, color: 'rgba(128,255,219,0.02)' },
                ],
              },
            },
            data: outboundSeries,
          },
        ],
      };
    });

    return {
      option,
    };
  },
};
