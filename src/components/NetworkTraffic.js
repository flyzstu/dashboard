import EChart from './EChart.js';

const { ref, computed, onMounted, onBeforeUnmount } = window.Vue;

const WINDOW_SIZE = 60;

function pad(value) {
  return String(value).padStart(2, '0');
}

function labelNow() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function nextValue(current, max = 150) {
  const base = current + (Math.random() - 0.5) * 20;
  return Math.max(2, Math.min(max, Math.round(base)));
}

export default {
  name: 'NetworkTraffic',
  components: { EChart },
  template: `
    <EChart :option="option" height="280px" />
  `,
  setup() {
    const labels = ref([]);
    const inData = ref([]);
    const outData = ref([]);
    let timer = null;

    const option = computed(() => ({
      grid: { left: 40, right: 20, top: 24, bottom: 28 },
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['入站 (MB/s)', '出站 (MB/s)'],
        top: 2,
        textStyle: { color: '#cfe6ff' },
      },
      xAxis: {
        type: 'category',
        data: labels.value,
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
          data: inData.value,
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
          data: outData.value,
        },
      ],
    }));

    function seed() {
      labels.value = [];
      inData.value = [];
      outData.value = [];
      let inbound = Math.round(50 + Math.random() * 20);
      let outbound = Math.round(30 + Math.random() * 20);
      for (let i = 0; i < WINDOW_SIZE; i += 1) {
        labels.value.push('');
        inbound = nextValue(inbound);
        outbound = nextValue(outbound);
        inData.value.push(inbound);
        outData.value.push(outbound);
      }
    }

    function tick() {
      labels.value.push(labelNow());
      if (labels.value.length > WINDOW_SIZE) labels.value.shift();

      const lastIn = inData.value[inData.value.length - 1] || 60;
      const lastOut = outData.value[outData.value.length - 1] || 40;
      inData.value.push(nextValue(lastIn, 220));
      outData.value.push(nextValue(lastOut, 180));

      if (inData.value.length > WINDOW_SIZE) inData.value.shift();
      if (outData.value.length > WINDOW_SIZE) outData.value.shift();
    }

    onMounted(() => {
      seed();
      tick();
      timer = setInterval(tick, 1000);
    });

    onBeforeUnmount(() => {
      if (timer) clearInterval(timer);
    });

    return {
      option,
    };
  },
};
