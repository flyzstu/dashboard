import App from './App.js';
import { initDataSource } from './services/dataSourceManager.js';

const { createApp } = window.Vue;

initDataSource();

createApp(App).mount('#app');
