<script setup lang="ts">
import { Info } from 'lucide-vue-next'

defineProps<{
  title?: string
  message?: string
}>()
</script>

<template>
  <div class="production-notice">
    <div class="notice-icon">
      <Info :size="24" />
    </div>
    <div class="notice-content">
      <h3>{{ title || 'Característica en Desarrollo' }}</h3>
      <p>
        {{ message || 'Actualmente, el sistema de foro utiliza un servidor local para la gestión de datos. Por este motivo, esta funcionalidad está habilitada únicamente para el entorno de desarrollo. Estamos trabajando para integrar un backend persistente en el futuro.' }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.production-notice {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.5rem;
  background: rgba(59, 130, 246, 0.1);
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  margin-bottom: 2rem;
  backdrop-filter: blur(8px);
}

.notice-icon {
  color: #3b82f6;
  flex-shrink: 0;
}

.notice-content h3 {
  margin: 0 0 0.5rem 0;
  color: #1d4ed8;
  font-size: 1.1rem;
  font-weight: 600;
}

.notice-content p {
  margin: 0;
  color: #1e3a8a;
  line-height: 1.5;
  font-size: 0.95rem;
}

/* Modo oscuro opcional si el proyecto lo soporta */
@media (prefers-color-scheme: dark) {
  .production-notice {
    background: rgba(30, 58, 138, 0.3);
    border-color: #60a5fa;
  }
  .notice-icon {
    color: #60a5fa;
  }
  .notice-content h3 {
    color: #93c5fd;
  }
  .notice-content p {
    color: #dbeafe;
  }
}
</style>
