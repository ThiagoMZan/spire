import { createRouter, createWebHistory } from "vue-router";
import HomePage from "./views/HomePage.vue";
import LoginPage from "./views/LoginPage.vue";
import { auth, refreshUser } from "./auth.js";
import { getModuleRoutes } from "./modules/registry.js";
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: LoginPage },
    { path: "/", name: "home", component: HomePage },
    ...getModuleRoutes(),
  ],
});
router.beforeEach(async (to) => {
  await refreshUser();
  if (!auth.user && to.name !== "login") return { name: "login" };
  if (auth.user && to.name === "login") return { name: "home" };
});
