import EChart from './EChart.js';

const { ref, computed, onMounted, onBeforeUnmount } = window.Vue;

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

function jitter(value) {
  const n = value + Math.round((Math.random() - 0.5) * 10);
  return Math.max(3, Math.min(97, n));
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
    const cpu = ref(28);
    const mem = ref(46);
    const disk = ref(62);
    let timer = null;

    const cpuOption = gaugeOption(cpu, 'CPU', ['#2dd4bf', '#4cc9f0', '#ff4d6d']);
    const memOption = gaugeOption(mem, '内存', ['#80ffdb', '#4cc9f0', '#ffbf69']);
    const diskOption = gaugeOption(disk, '磁盘', ['#34d399', '#60a5fa', '#f43f5e']);

    onMounted(() => {
      timer = setInterval(() => {
        cpu.value = jitter(cpu.value);
        mem.value = jitter(mem.value);
        disk.value = jitter(disk.value);
      }, 2000);
    });

    onBeforeUnmount(() => {
      if (timer) clearInterval(timer);
    });

    return {
      cpuOption,
      memOption,
      diskOption,
    };
  },
};
