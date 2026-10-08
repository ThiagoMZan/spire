<script setup>
import { computed } from "vue";
const props = defineProps({ name: { type: String, default: "grid" } });
const paths = {
  grid: ["M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"],
  folder: ["M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3V7Z"],
  users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87", "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM16 3a4 4 0 0 1 0 8"],
  file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6M8 13h8M8 17h6"],
  chart: ["M4 3v18h17M9 16v-5M14 16V7M19 16V4"],
  settings: ["m12 3 2 3 3-.2.7 3.1L20 11v2l-2.3 2.1-.7 3.1-3-.2-2 3-2-3-3 .2-.7-3.1L4 13v-2l2.3-2.1.7-3.1 3 .2 2-3Z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"],
  check: ["M9 11 12 14 20 6M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10"],
  calendar: ["M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"],
  activity: ["M3 12h4l3-8 4 16 3-8h4"],
  user: ["M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2"],
  panel: ["M3 4h18v16H3zM9 4v16M13 12h5m-2-2 2 2-2 2"],
  layers: ["m12 3 10 6-10 6L2 9l10-6ZM2 15l10 6 10-6"],
};
const strokes = computed(() => paths[props.name] || paths.grid);
</script>
<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path v-for="(path, index) in strokes" :key="index" :d="path" />
  </svg>
</template>
