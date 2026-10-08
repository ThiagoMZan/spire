<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { NAlert, NAvatar, NButton, NConfigProvider, NDialogProvider, NMessageProvider, NNotificationProvider, NIcon, NTooltip, ptBR, datePtBR } from "naive-ui";
import { auth, authRequest, refreshUser } from "./auth.js";
import ShellSidebar from "./components/ShellSidebar.vue";
import MenuIcon from "./components/MenuIcon.vue";
import { themeOverrides } from "./theme.js";
const route = useRoute();
const router = useRouter();
const mobileQuery = window.matchMedia("(max-width: 700px)");
const isMobile = ref(mobileQuery.matches);
const sidebarCollapsed = ref(mobileQuery.matches);
function syncMobile(event) {
  isMobile.value = event.matches;
  if (event.matches) sidebarCollapsed.value = true;
}
const signingOut = ref(false);
const error = ref("");
async function logout() {
  signingOut.value = true;
  error.value = "";
  try {
    await authRequest("logout", { method: "POST" });
    auth.user = null;
    await router.replace("/login");
  } catch { error.value = "Não foi possível sair. Tente novamente."; }
  finally { signingOut.value = false; }
}
async function checkSession() {
  if (!auth.user || document.visibilityState !== "visible") return;
  try {
    await refreshUser();
    if (!auth.user) await router.replace("/login");
  } catch { /* A temporary network failure must not discard the session. */ }
}
// Check when returning to the tab, without a heartbeat that defeats inactivity.
onMounted(() => {
  document.addEventListener("visibilitychange", checkSession);
  mobileQuery.addEventListener("change", syncMobile);
});
onUnmounted(() => {
  document.removeEventListener("visibilitychange", checkSession);
  mobileQuery.removeEventListener("change", syncMobile);
});
</script>
<template>
  <NConfigProvider :theme-overrides="themeOverrides" :locale="ptBR" :date-locale="datePtBR">
    <NMessageProvider><NNotificationProvider><NDialogProvider>
      <RouterView v-if="route.name === 'login'" />
      <div v-else class="app-shell" :style="{ '--sidebar-width': sidebarCollapsed ? '76px' : '250px' }">
<ShellSidebar :collapsed="sidebarCollapsed" />
        <button v-if="isMobile && !sidebarCollapsed" class="sidebar-backdrop" aria-label="Fechar menu" @click="sidebarCollapsed = true"></button>
        <div class="workspace">
          <header class="topbar">
            <div class="topbar-navigation">
              <NTooltip trigger="hover">
                <template #trigger>
                  <NButton quaternary :aria-label="sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'" :aria-expanded="!sidebarCollapsed" @click="sidebarCollapsed = !sidebarCollapsed">
                    <template #icon><NIcon :size="20"><MenuIcon name="panel" /></NIcon></template>
                  </NButton>
                </template>
                {{ sidebarCollapsed ? 'Expandir menu' : 'Recolher menu' }}
              </NTooltip>
              <span class="muted">Início</span>
            </div>
            <div class="account">
              <NAvatar round size="small" :style="{ background: '#eef2ff', color: '#4f46e5' }">{{ auth.user?.displayName?.slice(0, 1).toUpperCase() }}</NAvatar>
              <span class="account-name">{{ auth.user?.displayName }}</span>
              <NButton size="small" :loading="signingOut" @click="logout">Sair</NButton>
            </div>
          </header>
          <main class="content">
            <NAlert v-if="error" type="error" role="alert" class="form-alert">{{ error }}</NAlert>
            <RouterView />
          </main>
        </div>
      </div>
    </NDialogProvider></NNotificationProvider></NMessageProvider>
  </NConfigProvider>
</template>
