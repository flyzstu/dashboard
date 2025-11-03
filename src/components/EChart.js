const { ref, computed, onMounted, onBeforeUnmount, watch } = Vue;

export default {
  name: 'EChart',
  props: {
    option: { type: Object, required: true },
    height: { type: String, default: '100%' },
    renderer: { type: String, default: 'canvas' },
  },
  template: `
    <div ref="chartEl" class="chart" :style="{ height: heightValue }"></div>
  `,
  setup(props) {
    const chartEl = ref(null);
    let chart = null;

    const heightValue = computed(() => props.height);

    const render = () => {
      if (!chart || !props.option) return;
      chart.setOption(props.option, true);
    };

    const resize = () => {
      if (chart) chart.resize();
    };

    onMounted(() => {
      chart = echarts.init(chartEl.value, undefined, { renderer: props.renderer });
      render();
      window.addEventListener('resize', resize);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', resize);
      if (chart) {
        chart.dispose();
        chart = null;
      }
    });

    watch(() => props.option, render, { deep: true });

    return {
      chartEl,
      heightValue,
    };
  },
};
