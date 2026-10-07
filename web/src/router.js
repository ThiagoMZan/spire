import { createRouter, createWebHistory } from "vue-router";
import HomePage from "./views/HomePage.vue";
import { getModuleRoutes } from "./modules/registry.js";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomePage },
    ...getModuleRoutes(),
  ],
});
