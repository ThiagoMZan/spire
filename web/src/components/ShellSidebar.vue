<script setup>
import { computed, h } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { NIcon, NMenu, NText, useMessage, useThemeVars } from "naive-ui";
import SpireMark from "./SpireMark.vue";
import MenuIcon from "./MenuIcon.vue";
import { getModuleMenus } from "../modules/registry.js";
defineProps({ collapsed: { type: Boolean, default: false } });
const route = useRoute();
const router = useRouter();
const message = useMessage();
const theme = useThemeVars();
const icon = (name) => () => h(NIcon, null, { default: () => h(MenuIcon, { name }) });
const demo = (key, label, name) => ({ key: "demo:" + key, label, icon: icon(name) });
const modules = getModuleMenus();
const options = [
  { key: "overview", label: "Visão geral", icon: icon("grid"), children: [
    { key: "home", label: () => h(RouterLink, { to: "/" }, { default: () => "Início" }), icon: icon("grid"), to: "/" },
    demo("activity", "Atividades", "activity"),
  ] },
  { key: "workspace", label: "Área de trabalho", icon: icon("folder"), children: [
    demo("projects", "Projetos", "folder"), demo("tasks", "Tarefas", "check"), demo("calendar", "Calendário", "calendar"),
  ] },
  { key: "people", label: "Pessoas", icon: icon("users"), children: [
    demo("team", "Equipe", "users"), demo("clients", "Clientes", "user"),
  ] },
  { key: "files", label: "Arquivos", icon: icon("file"), children: [
    demo("documents", "Documentos", "file"), demo("folders", "Pastas", "folder"),
  ] },
  { key: "reports", label: "Relatórios", icon: icon("chart"), children: [
    demo("indicators", "Indicadores", "chart"), demo("history", "Histórico", "activity"),
  ] },
  { key: "settings", label: "Configurações", icon: icon("settings"), children: [
    demo("profile", "Meu perfil", "user"), demo("preferences", "Preferências", "settings"), demo("sessions", "Sessões", "layers"),
  ] },
  ...(modules.length ? [
    { key: "module-divider", type: "divider" },
    ...modules.map((item) => ({
      key: "module:" + (item.id || item.to),
      label: () => h(RouterLink, { to: item.to }, { default: () => item.label }),
      icon: typeof item.icon === "function" ? item.icon : icon("layers"),
      to: item.to,
    })),
  ] : []),
];
const selected = computed(() => {
  const module = modules.find((item) => route.path === item.to || route.path.startsWith(item.to + "/"));
  return module ? "module:" + (module.id || module.to) : route.path === "/" ? "home" : null;
});
function select(key, item) {
  if (String(key).startsWith("demo:")) {
    message.info(item.label + ": opção de exemplo para validar o menu.");
  } else if (item.to && route.path !== item.to) {
    router.push(item.to);
  }
}
const nodeProps = (option) => ({ "aria-label": typeof option.label === "string" ? option.label : option.key === "home" ? "Início" : undefined });
</script>
<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }" aria-label="Menu lateral">
    <RouterLink to="/" class="sidebar-brand" aria-label="Spire — início">
      <SpireMark class="sidebar-logo" />
      <span v-if="!collapsed" class="sidebar-brand-name">Spire</span>
    </RouterLink>
    <nav class="sidebar-navigation" aria-label="Navegação principal">
      <NMenu :value="selected" :options="options" :collapsed="collapsed" :collapsed-width="76" :collapsed-icon-size="20" :icon-size="20" :indent="24" :root-indent="24" :node-props="nodeProps" accordion @update:value="select" />
    </nav>
    <div v-if="!collapsed" class="sidebar-bottom">
      <NText depth="3" class="sidebar-bottom-label">SEU ESPAÇO DE TRABALHO</NText>
      <NText depth="3" class="sidebar-bottom-note">Tudo começa por aqui.</NText>
    </div>
  </aside>
</template>
<style scoped>
.sidebar { height: 100dvh; position: sticky; top: 0; display: flex; flex-direction: column; width: var(--sidebar-width); background: #fff; border-right: 1px solid #e4e7ec; overflow: hidden; transition: width .2s ease; }
.sidebar-brand { min-height: 76px; display: flex; align-items: center; gap: 12px; padding: 0 24px; flex-shrink: 0; }
.sidebar-logo { width: 26px; height: 26px; color: v-bind('theme.primaryColor'); flex-shrink: 0; }
.sidebar-brand-name { font-size: 20px; font-weight: 500; letter-spacing: -.5px; }
.sidebar--collapsed .sidebar-brand { justify-content: center; padding: 0; }
.sidebar-navigation { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding-top: 8px; padding-bottom: 24px; }
.sidebar-bottom { padding: 24px; display: flex; flex-direction: column; gap: 6px; }
.sidebar-bottom-label { font-size: 9px; letter-spacing: 1.3px; }
.sidebar-bottom-note { font-size: 11px; }
@media (max-width: 700px) {
  .sidebar { z-index: 20; }
  .sidebar:not(.sidebar--collapsed) { position: fixed; left: 0; box-shadow: 8px 0 32px #10182818; }
}
@media (prefers-reduced-motion: reduce) { .sidebar { transition: none; } }
</style>
