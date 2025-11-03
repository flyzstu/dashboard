<template>
  <div ref="el" class="chart" :style="{ height }"></div>
</template>

<script setup>
import * as echarts from 'echarts';
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '100%' },
  renderer: { type: String, default: 'canvas' },
});

const el = ref(null);
let chart = null;

const render = () => {
  if (!chart || !props.option) return;
  chart.setOption(props.option, true);
};

const resize = () => {
  if (chart) chart.resize();
};

onMounted(() => {
  chart = echarts.init(el.value, undefined, { renderer: props.renderer });
  render();
  window.addEventListener('resize', resize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
  if (chart) chart.dispose();
  chart = null;
});

watch(() => props.option, render, { deep: true });
</script>

<style scoped>
</style>
