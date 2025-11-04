import { useDashboardStore } from '../services/dashboardStore.js';

const { computed } = window.Vue;

export default {
  name: 'AlertsPanel',
  template: `
    <div class="content" style="overflow:auto;">
      <ul class="alert-list">
        <li class="alert-item" v-for="(a, idx) in displayAlerts" :key="a.id + '-' + idx">
          <span class="level" :class="levelClass(a.level)">{{ levelText(a.level) }}</span>
          <span class="msg">{{ a.message }}</span>
          <span class="time">{{ a.time }}</span>
        </li>
      </ul>
    </div>
  `,
  setup() {
    const store = useDashboardStore();

    const alerts = computed(() => (Array.isArray(store.alerts) ? store.alerts : []));
    const displayAlerts = computed(() => alerts.value.slice(0, 10));

    const levelClass = (level) => (level === 'critical' ? 'level-critical' : level === 'warn' ? 'level-warn' : 'level-info');
    const levelText = (level) => (level === 'critical' ? '严重' : level === 'warn' ? '警告' : '信息');

    return {
      displayAlerts,
      levelClass,
      levelText,
    };
  },
};
