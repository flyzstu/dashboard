const { reactive, readonly } = window.Vue;

const dashboardState = reactive({
  resourceGauges: {
    cpu: 0,
    mem: 0,
    disk: 0,
  },
  networkTraffic: {
    labels: [],
    inbound: [],
    outbound: [],
  },
  diskUsage: {
    labels: [],
    used: [],
  },
  serverStatus: [],
  alerts: [],
});

export function useDashboardStore() {
  return readonly(dashboardState);
}

export function getDashboardMutableState() {
  return dashboardState;
}
