<script setup>
import { NCard, NTag } from "naive-ui";
import { auth } from "../auth.js";
</script>
<template>
  <section class="welcome-page">
    <p class="eyebrow">SEU ESPAÇO DE TRABALHO</p>
    <h1>Olá, {{ auth.user?.displayName }}.</h1>
    <p class="muted welcome-description">Boas-vindas ao Spire. Vamos construir seu espaço de trabalho a partir daqui.</p>
    <NCard title="Tudo pronto para começar" class="welcome-card">
      <p>Você está conectado. As funcionalidades do seu espaço estarão disponíveis no menu lateral.</p>
      <NTag type="success" round :bordered="false">Sessão ativa</NTag>
    </NCard>
  </section>
</template>
