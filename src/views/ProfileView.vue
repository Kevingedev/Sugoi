<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useSkinStore } from '@/stores/skinStore';
import { useTrackingStore } from '@/stores/trackingStore';
import { useForumStore } from '@/stores/forum';
import { storeToRefs } from 'pinia';
import SkinGallery from '@/components/Skin/SkinGallery.vue';
import SkinDetailsModal from '@/components/Skin/SkinDetailsModal.vue';
import ConfirmModal from '@/components/Common/ConfirmModal.vue';
import { User as UserIcon, Activity, MessageSquare } from 'lucide-vue-next';
import ProductionNotice from '@/components/Common/ProductionNotice.vue';
import type { GalleryItem } from '@/types/skin';

const isProduction = import.meta.env.PROD;

import ProfileTracking from '@/components/Profile/ProfileTracking.vue';
import ProfileForum from '@/components/Profile/ProfileForum.vue';

const authStore = useAuthStore();
const skinStore = useSkinStore();
const trackingStore = useTrackingStore();
const forumStore = useForumStore();

const { user } = storeToRefs(authStore);
const { activeHomeAvatarUrl } = storeToRefs(skinStore);

const selectedItem = ref<GalleryItem | null>(null);
const itemToDelete = ref<string | null>(null);

onMounted(async () => {
  await skinStore.loadFromServer();
  if (authStore.user) {
    await trackingStore.loadUserTracking(Number(authStore.user.id));
    await forumStore.fetchTopics();
  }
});

const userTopics = computed(() => {
  if (!user.value) return [];
  return forumStore.topics.filter(t => t.author === user.value?.username);
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
  <div class="profile-view container">
    <!-- Confirmation Modal -->
    <ConfirmModal 
      :show="!!itemToDelete"
      title="¿ELIMINAR AVATAR?"
      message="¿Estás seguro de que quieres eliminar este avatar de tu galería? Esta acción no se puede deshacer."
      @confirm="handleConfirmDelete"
      @cancel="itemToDelete = null"
    />

    <SkinDetailsModal
      :item="selectedItem"
      @close="selectedItem = null"
      @download="skinStore.downloadImage($event)"
      @set-home="skinStore.setActiveHomeAvatar($event)"
      @delete="handleDeleteRequest"
    />

    <!-- Header -->
    <header class="profile-header">
      <h1 class="title">
        <span class="kanji">ユーザープロフィール</span>
        <br /> MI PERFIL
      </h1>
      <p class="subtitle">Gestiona tu identidad y tus creaciones Sugoi</p>
    </header>

    <ProductionNotice 
      v-if="isProduction" 
      message="El perfil de usuario consolida tus avatares, temas del foro y seguimiento personal. Estas funciones dependen de un servidor activo y actualmente solo están disponibles de forma local."
    />

    <main class="profile-grid">
      <!-- Section 1: User Identity -->
      <section class="profile-card border-thick shadow-lg">
        <div class="user-info-layout">
          <div class="avatar-display-wrapper">
            <div class="avatar-frame border-thick shadow-sm">
              <img v-if="activeHomeAvatarUrl" :src="activeHomeAvatarUrl" alt="User Avatar" class="avatar-img" />
              <div v-else class="avatar-placeholder">
                {{ user?.username.charAt(0).toUpperCase() }}
              </div>
            </div>
            <span class="avatar-tag border-thick shadow-xs">ACTIVO</span>
          </div>

          <div class="user-details">
            <div class="detail-group">
              <h3 class="detail-label"><UserIcon :size="16" /> USUARIO</h3>
              <p class="detail-value">{{ user?.username }}</p>
            </div>
            <div class="detail-group">
              <h3 class="detail-label">EMAIL</h3>
              <p class="detail-value">{{ user?.email }}</p>
            </div>
          </div>
          <img src="@/assets/images/gif/eatingcheetos.gif" alt="Decoration" class="eating-gif" />
        </div>
      </section>

      <!-- Section 2: Tracking (Component) -->
      <ProfileTracking :stats="trackingStore.stats" />

      <!-- Section 3: Gallery (Dynamic) -->
      <section class="gallery-section">
        <div class="section-header-inline">
          <h3 class="section-title">MIS AVATARES GENERADOS</h3>
          <router-link to="/create-skin" class="button-primary small-btn">NUEVO</router-link>
        </div>
        <SkinGallery @select-item="selectedItem = $event" />
      </section>

      <!-- Section 4: Forum (Component) -->
      <ProfileForum :topics="userTopics" />
    </main>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  max-width: 1100px;
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
    linear-gradient(rgba(246, 247, 247, 0.9), rgba(255, 255, 255, 0.9)),
    url('@/assets/images/image/lineas4.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.profile-header {
  text-align: center;
  margin-bottom: var(--spacing-xxl);
}

.kanji {
  font-size: 2.6rem;
  font-weight: var(--font-weight-black);
  color: var(--color-primary);
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

/* Grid Layout */
.profile-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxl);
}

/* User Card */
.profile-card {
  position: relative;
  background-color: var(--color-white-snow);
  padding: var(--spacing-xl);
  overflow: hidden;
}

.user-info-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--spacing-xl);
  align-items: center;
}

.eating-gif {
  position: absolute;
  right: 15px;
  bottom: -10px;
  width: 140px;
  height: auto;
  pointer-events: none;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
}

.avatar-display-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-frame {
  width: 100%;
  aspect-ratio: 1/1;
  background-color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 5rem;
  font-weight: var(--font-weight-black);
  color: var(--color-white-snow);
}

.avatar-tag {
  position: absolute;
  bottom: -15px;
  background-color: var(--color-black-carbon);
  color: var(--color-white-snow);
  padding: 4px 12px;
  font-size: 0.7rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 2px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.detail-label {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: var(--font-weight-black);
  letter-spacing: 1px;
}

.detail-value {
  font-size: 1.5rem;
  font-family: var(--font-heading);
  font-weight: var(--font-weight-black);
  color: var(--color-black-carbon);
  margin: 0;
}

.section-title {
  font-family: var(--font-heading);
  font-weight: var(--font-weight-black);
  font-size: var(--font-size-md);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-black-carbon);
}

/* Gallery Section */
.section-header-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.small-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 0.7rem;
}

/* Responsive */
@media (max-width: 768px) {
  .user-info-layout {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .avatar-display-wrapper {
    max-width: 180px;
    margin: 0 auto;
  }

  .detail-label {
    justify-content: center;
  }

  .detail-value {
    font-size: 1.2rem;
  }

  .eating-gif {
    width: 100px;
    right: 5px;
    bottom: -5px;
    opacity: 0.8;
  }
}
</style>
