<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { NAlert, NButton, NDivider, NForm, NFormItem, NH1, NIcon, NInput, NTag, NText, useMessage, useThemeVars } from "naive-ui";
import { auth, authRequest } from "../auth.js";
import SpireMark from "../components/SpireMark.vue";

const router = useRouter();
const message = useMessage();
const themeVars = useThemeVars();
const loginArtUrl = import.meta.env.VITE_LOGIN_ART_URL || "/images/login-art.svg";
const artVisible = ref(true);
const formRef = ref(null);
const credentials = reactive({ email: "", password: "" });
const loading = ref(false);
const error = ref("");
const rules = {
  email: [
    { required: true, message: "Informe seu email.", trigger: ["blur", "input"] },
    { type: "email", message: "Informe um email válido.", trigger: ["blur", "input"] },
  ],
  password: { required: true, message: "Informe sua senha.", trigger: ["blur", "input"] },
};
async function login() {
  if (loading.value) return;
  try { await formRef.value?.validate(); } catch { return; }
  error.value = "";
  loading.value = true;
  try {
    auth.user = (await authRequest("login", { method: "POST", body: JSON.stringify(credentials) })).user;
    credentials.password = "";
    await router.replace("/");
  } catch (failure) {
    error.value = failure.status === 401 ? "Email ou senha incorretos." : failure.status === 429 ? "Muitas tentativas. Tente novamente em 15 minutos." : "Não foi possível entrar. Tente novamente.";
  } finally { loading.value = false; }
}
function previewGoogle() {
  message.info("O login com Google é uma demonstração e ainda não está disponível.");
}
</script>

<template>
  <main class="login-page">
    <img v-if="artVisible" class="login-art" :src="loginArtUrl" alt="" aria-hidden="true" @error="artVisible = false" />

    <section class="login-form-panel" aria-labelledby="login-title">
      <div class="login-form-content">
<header class="login-header">
          <SpireMark class="login-logo" />
          <div class="login-wordmark">spire</div>
          <NH1 id="login-title" class="login-heading">Entre no seu espaço</NH1>
          <NText depth="3" class="login-subtitle">Bom ter você por aqui. Vamos começar?</NText>
        </header>

        <NForm ref="formRef" :model="credentials" :rules="rules" size="large" :show-require-mark="false" @submit.prevent="login">
          <NFormItem path="email" :show-label="false">
            <NInput v-model:value="credentials.email" :input-props="{ id: 'login-email', type: 'email', autocomplete: 'username', 'aria-label': 'Email' }" placeholder="Seu email" :disabled="loading">
              <template #prefix>
                <NIcon :size="18" :depth="3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>
                </NIcon>
              </template>
            </NInput>
          </NFormItem>
          <NFormItem path="password" :show-label="false">
            <NInput v-model:value="credentials.password" type="password" show-password-on="click" :input-props="{ id: 'login-password', autocomplete: 'current-password', 'aria-label': 'Senha' }" placeholder="Sua senha" :disabled="loading">
              <template #prefix>
                <NIcon :size="18" :depth="3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>
                </NIcon>
              </template>
            </NInput>
          </NFormItem>
          <NAlert v-if="error" type="error" role="alert" class="login-error">{{ error }}</NAlert>
          <NButton type="primary" attr-type="submit" block size="large" :loading="loading" :disabled="loading">
            Entrar
            <template #icon><NIcon :size="18"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg></NIcon></template>
          </NButton>
        </NForm>
        <NDivider class="login-divider"><NText depth="3">ou continue com</NText></NDivider>
        <NButton block size="large" :disabled="loading" @click="previewGoogle" class="login-google">
          <template #icon>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
              <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.06a10 10 0 0 0 0 9.02l3.35-2.59Z" />
              <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.35 2.59C7.2 7.72 9.4 5.96 12 5.96Z" />
            </svg>
          </template>
          Continuar com Google
          <NTag size="small" :bordered="false" class="login-google-tag">Em breve</NTag>
        </NButton>
        <NText depth="3" class="login-note">Um espaço para trabalhar do seu jeito.</NText>
      </div>
    </section>
    <NText depth="3" class="login-page-footer">Spire · Seu espaço de trabalho</NText>
  </main>
</template>

<style scoped>
.login-page { min-height: 100dvh; display: grid; place-items: center; position: relative; isolation: isolate; overflow: hidden; padding: 64px 24px 88px; background: #fff; }
.login-art { position: absolute; inset: 0; z-index: -1; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
.login-form-panel { width: 100%; max-width: 440px; padding: 16px 24px 24px; background: #fff; }
.login-form-content { width: 100%; }
.login-header { text-align: center; margin-bottom: 32px; }
.login-logo { width: 54px; height: 54px; color: v-bind('themeVars.primaryColor'); display: block; margin: 0 auto 8px; }
.login-wordmark { font-size: 20px; font-weight: 600; letter-spacing: -.6px; margin-bottom: 24px; }
.login-heading { margin: 0 0 10px; font-size: 30px; font-weight: 600; line-height: 1.3; letter-spacing: -.8px; }
.login-subtitle { display: block; font-size: 14px; }
.login-google-tag { margin-left: 12px; }
.login-divider { margin: 24px 0; font-size: 12px; }
.login-error { margin-bottom: 20px; }
.login-note { display: block; text-align: center; font-size: 12px; margin-top: 24px; }
.login-page-footer { position: absolute; bottom: 24px; left: 24px; right: 24px; text-align: center; font-size: 11px; }
@media (max-width: 900px) { .login-art { opacity: .65; } }
@media (max-width: 600px) {
  .login-page { padding: 40px 20px 72px; }
  .login-form-panel { padding: 8px 0 20px; }
  .login-art { display: none; }
  .login-heading { font-size: 28px; }
  .login-page-footer { bottom: 20px; }
}
</style>
