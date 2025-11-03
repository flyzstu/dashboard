<template>
  <EChart :option="option" height="280px" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import EChart from './EChart.vue';

const windowSize = 60;
const labels = ref([]);
const inData = ref([]);
const outData = ref([]);
let timer;

function pad(n) { return String(n).padStart(2, '0'); }
function labelNow() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function next(val, max = 150) {
  const base = val + (Math.random() - 0.5) * 20;
  return Math.max(2, Math.min(max, Math.round(base)));
}

function seed() {
  labels.value = [];
  inData.value = [];
  outData.value = [];
  let i = Math.round(50 + Math.random() * 20);
  let o = Math.round(30 + Math.random() * 20);
  for (let k = 0; k < windowSize; k++) {
    labels.value.push('');
    i = next(i);
    o = next(o);
    inData.value.push(i);
    outData.value.push(o);
  }
}

function tick() {
  labels.value.push(labelNow());
  if (labels.value.length > windowSize) labels.value.shift();
  const lastIn = inData.value[inData.value.length - 1] || 60;
  const lastOut = outData.value[outData.value.length - 1] || 40;
  inData.value.push(next(lastIn, 220));
  outData.value.push(next(lastOut, 180));
  if (inData.value.length > windowSize) inData.value.shift();
  if (outData.value.length > windowSize) outData.value.shift();
}

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
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(76,201,240,0.35)' },
            { offset: 1, color: 'rgba(76,201,240,0.02)' }
          ]
        }
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
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(128,255,219,0.30)' },
            { offset: 1, color: 'rgba(128,255,219,0.02)' }
          ]
        }
      },
      data: outData.value,
    }
  ]
}));

onMounted(() => {
  seed();
  tick();
  timer = setInterval(tick, 1000);
});

onBeforeUnmount(() => clearInterval(timer));
</script>

<style scoped>
</style>
