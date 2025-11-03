<template>
  <EChart :option="option" height="260px" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import EChart from './EChart.vue';

const labels = ref(['/data', '/db', '/logs', '/backup', '/tmp']);
const used = ref([72, 58, 83, 45, 38]);
let timer;

function jitter(v) {
  let n = v + Math.round((Math.random() - 0.5) * 6);
  n = Math.max(5, Math.min(95, n));
  return n;
}

function tick() {
  used.value = used.value.map((v) => jitter(v));
}

const option = computed(() => ({
  grid: { left: 48, right: 16, top: 16, bottom: 24 },
  xAxis: {
    type: 'category',
    data: labels.value,
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
      data: used.value,
      barWidth: 18,
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#4cc9f0' },
            { offset: 1, color: 'rgba(76,201,240,0.35)' },
          ]
        },
      },
      label: { show: true, position: 'top', color: '#cfe6ff', formatter: '{c}%' }
    }
  ]
}));

onMounted(() => {
  timer = setInterval(tick, 2500);
});

onBeforeUnmount(() => clearInterval(timer));
</script>

<style scoped>
</style>
