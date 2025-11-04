import EChart from './EChart.js';
import { useDashboardStore } from '../services/dashboardStore.js';

const { computed } = window.Vue;

function gaugeOption(valueRef, name, colors) {
  return computed(() => ({
    grid: { top: 0, bottom: 0 },
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        progress: { show: true, width: 10 },
        axisLine: {
          lineStyle: {
            width: 10,
            color: [
              [0.3, colors[0]],
              [0.7, colors[1]],
              [1, colors[2]],
            ],
          },
        },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: {
          show: true,
          offsetCenter: [0, '70%'],
          color: '#89a1c1',
          fontSize: 12,
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: '#e8f1ff',
          fontSize: 20,
        },
        data: [
          {
            value: valueRef.value,
            name,
          },
        ],
      },
    ],
  }));
}

export default {
  name: 'ResourceGauges',
  components: { EChart },
  template: `
    <div class="kpi">
      <EChart :option="cpuOption" height="280px" />
      <EChart :option="memOption" height="280px" />
      <EChart :option="diskOption" height="280px" />
    </div>
  `,
  setup() {
    const store = useDashboardStore();

    const cpuValue = computed(() => store.resourceGauges?.cpu ?? 0);
    const memValue = computed(() => store.resourceGauges?.mem ?? 0);
    const diskValue = computed(() => store.resourceGauges?.disk ?? 0);

    const cpuOption = gaugeOption(cpuValue, 'CPU', ['#2dd4bf', '#4cc9f0', '#ff4d6d']);
    const memOption = gaugeOption(memValue, '内存', ['#80ffdb', '#4cc9f0', '#ffbf69']);
    const diskOption = gaugeOption(diskValue, '磁盘', ['#34d399', '#60a5fa', '#f43f5e']);

    return {
      cpuOption,
      memOption,
      diskOption,
    };
  },
};
