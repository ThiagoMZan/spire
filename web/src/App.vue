<script setup>
import { RouterLink, RouterView } from "vue-router";
import { getModuleMenus } from "./modules/registry.js";

const menus = getModuleMenus();
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">Spire</div>

      <nav class="nav">
        <RouterLink to="/">Home</RouterLink>

        <RouterLink
          v-for="item in menus"
          :key="item.id || item.to"
          :to="item.to"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>
