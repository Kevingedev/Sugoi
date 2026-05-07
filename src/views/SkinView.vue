<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSkinStore } from '@/stores/skinStore';
import { useAuthStore } from '@/stores/authStore';
import SkinGenerator from '@/components/Skin/SkinGenerator.vue';
import SkinGallery from '@/components/Skin/SkinGallery.vue';
import SkinDetailsModal from '@/components/Skin/SkinDetailsModal.vue';
import ConfirmModal from '@/components/Common/ConfirmModal.vue';
import ProductionNotice from '@/components/Common/ProductionNotice.vue';
import type { GalleryItem } from '@/types/skin';

const isProduction = import.meta.env.PROD;

const skinStore = useSkinStore();
const authStore = useAuthStore();
const selectedItem = ref<GalleryItem | null>(null);
const itemToDelete = ref<string | null>(null);

onMounted(async () => {
  await skinStore.loadFromServer();
});

const handleDeleteRequest = (url: string) => {
  itemToDelete.value = url;
};

const handleConfirmDelete = () => {
  if (itemToDelete.value) {
    skinStore.deleteImage(itemToDelete.value);
    itemToDelete.value = null;
    selectedItem.value = null;
  }
};
</script>

<template>
  <div class="skin-view container">
      <!-- Confirmation Modal -->
      <ConfirmModal 
        :show="!!itemToDelete"
        title="¿ELIMINAR ESTA CREACIÓN?"
        message="Esta acción no se puede deshacer de forma manual."
        confirmText="SÍ, ELIMINAR"
        @confirm="handleConfirmDelete"
        @cancel="itemToDelete = null"
      />
    <header class="skin-header">
      <h1 class="title"><span class="kanji">アバターを作成しましょう</span> <br> Crea tu Avatar</h1>
      <p class="subtitle">Genera un avatar único estilo anime en pixel art</p>
    </header>

    <ProductionNotice 
      v-if="isProduction" 
      message="La generación y el guardado de avatares personalizados requieren de un servidor activo. Actualmente, esta funcionalidad solo está plenamente operativa en el entorno de desarrollo local."
    />

    <main class="skin-content">
      <!-- Guest Notice Banner -->
      <div v-if="!authStore.isAuthenticated" class="auth-notice-banner card shadow-sm">
        <p>
          DEBES <router-link to="/sign-in" class="auth-link">INICIAR SESIÓN</router-link> PARA GENERAR Y GUARDAR TUS AVATARES.
        </p>
      </div>

      <SkinGenerator />
      
      <SkinGallery v-if="authStore.isAuthenticated" @select-item="selectedItem = $event" />

      <SkinDetailsModal
        v-if="authStore.isAuthenticated"
        :item="selectedItem"
        @close="selectedItem = null"
        @download="skinStore.downloadImage($event)"
        @set-home="skinStore.setActiveHomeAvatar($event)"
        @delete="handleDeleteRequest"
      />
    </main>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--spacing-xxl) var(--spacing-md);
}

.container::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(246, 247, 247, 0.85), rgba(255, 255, 255, 0.85)),
    url('@/assets/images/image/lineas5.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.container > * {
  position: relative;
  z-index: 1;
}

.skin-header {
  text-align: center;
  margin-bottom: var(--spacing-xxl);
}

.title {
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  font-family: var(--font-body);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-lg);
  color: var(--color-black-carbon);
}

.skin-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxl);
}

.kanji {
  font-size: 2.6rem;
  font-weight: var(--font-weight-black);
  color: var(--color-primary);
}

.kanji.orange {
  color: #FF6B00;
}

/* Auth Banner Styles (Shared with Forum) */
.auth-notice-banner {
  padding: var(--spacing-lg);
  text-align: center;
  background-color: var(--color-white-snow);
  border: var(--border-thick);
  font-family: var(--font-heading);
  letter-spacing: 1px;
  margin-bottom: var(--spacing-md);
}

.auth-link {
  color: var(--color-primary);
  text-decoration: underline;
  font-weight: var(--font-weight-black);
}

.auth-link:hover {
  filter: brightness(0.9);
}
</style>
