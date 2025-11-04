import EChart from './EChart.js';
import { useDashboardStore } from '../services/dashboardStore.js';

const { computed } = window.Vue;

export default {
  name: 'DiskUsage',
  components: { EChart },
  template: `
    <EChart :option="option" height="260px" />
  `,
  setup() {
    const store = useDashboardStore();

    const option = computed(() => {
      const labels = Array.isArray(store.diskUsage?.labels) ? store.diskUsage.labels : [];
      const values = Array.isArray(store.diskUsage?.used) ? store.diskUsage.used : [];
      const dataset = labels.length
        ? labels.map((label, index) => ({ label, value: values[index] ?? 0 }))
        : [{ label: '-', value: 0 }];

      return {
        grid: { left: 48, right: 16, top: 16, bottom: 24 },
        xAxis: {
          type: 'category',
          data: dataset.map((item) => item.label),
          axisLabel: { color: '#a9c2e8' },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
        },
        yAxis: {
          type: 'value',
          name: '%',
          axisLabel: { color: '#a9c2e8' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        },
        tooltip: { trigger: 'axis' },
        series: [
          {
            type: 'bar',
            data: dataset.map((item) => item.value),
            barWidth: 18,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#4cc9f0' },
                  { offset: 1, color: 'rgba(76,201,240,0.35)' },
                ],
              },
            },
            label: { show: true, position: 'top', color: '#cfe6ff', formatter: '{c}%' },
          },
        ],
      };
    });

    return {
      option,
    };
  },
};
