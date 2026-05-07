<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useForumStore } from '@/stores/forum'
import { useAuthStore } from '@/stores/authStore'
import { useScrollToTopOnUpdate } from '@/composables/useScroll'
import TopicCard from '@/components/Forum/TopicCard.vue'
import CreateTopicForm from '@/components/Forum/CreateTopicForm.vue'
import eatingRiceGif from '@/assets/images/gif/eatingrice.gif'
import ProductionNotice from '@/components/Common/ProductionNotice.vue'

const isProduction = import.meta.env.PROD

const forumStore = useForumStore()
const authStore = useAuthStore()
const showCreateForm = ref(false)
const searchQuery = ref('')

const currentPage = ref(1)
const itemsPerPage = 5

// Auto-scroll on page change
useScrollToTopOnUpdate(currentPage)

onMounted(async () => {
  await forumStore.fetchTopics()
})

const filteredTopics = computed(() => {
  if (!searchQuery.value) return forumStore.topics
  
  const query = searchQuery.value.toLowerCase()
  return forumStore.topics.filter(topic => 
    topic.title.toLowerCase().includes(query)
  )
})

const totalPages = computed(() => Math.ceil(filteredTopics.value.length / itemsPerPage))

const paginatedTopics = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredTopics.value.slice(start, end)
})

watch(searchQuery, () => {
  currentPage.value = 1
})

watch(currentPage, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
})

const handleTopicCreated = () => {
  showCreateForm.value = false
}
</script>

<template>
  <div class="forum-container">
    <header class="forum-header">
      <div class="header-content">
        <h1 class="forum-title">Comunidad Sugoi</h1>
        <p class="forum-subtitle">Discute, comparte y explora el mundo del manga y el anime.</p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <img :src="eatingRiceGif" class="forum-rice-gif" alt="Eating Rice" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar temas..." 
            class="search-input"
          />
        </div>
        <button 
          v-if="authStore.isAuthenticated"
          @click="showCreateForm = !showCreateForm" 
          class="button-primary"
        >
          {{ showCreateForm ? 'Cancelar' : 'Nuevo Tema' }}
        </button>
      </div>
    </header>

    <ProductionNotice v-if="isProduction" />

    <!-- Guest Notice Banner -->
    <div v-if="!authStore.isAuthenticated" class="auth-notice-banner card shadow-sm">
      <p>
        DEBES <router-link to="/sign-in" class="auth-link">INICIAR SESIÓN</router-link> PARA PUBLICAR UN TEMA.
      </p>
    </div>

    <div v-if="showCreateForm" class="create-section card">
      <CreateTopicForm @created="handleTopicCreated" />
    </div>

    <main class="topics-list">
      <div v-if="forumStore.loading" class="loading">
        Cargando temas...
      </div>
      <template v-else>
        <TopicCard 
          v-for="topic in paginatedTopics" 
          :key="topic.id" 
          :topic="topic" 
        />
        <div v-if="filteredTopics.length === 0" class="empty-state card">
          {{ searchQuery ? 'No se encontraron temas que coincidan con tu búsqueda.' : 'No hay temas aún. ¡Sé el primero en crear uno!' }}
        </div>

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="pagination">
          <button 
            v-for="page in totalPages" 
            :key="page"
            :class="['page-button', { active: currentPage === page }]"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
        </nav>
      </template>
    </main>
  </div>
</template>

<style scoped>
.forum-container {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--spacing-xxl) var(--spacing-md);
}

.forum-container::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(246, 247, 247, 0.85), rgba(255, 255, 255, 0.85)),
    url('@/assets/images/image/lineas4.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.forum-container > * {
  position: relative;
  z-index: 1;
}

.forum-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--spacing-xxl);
  border-bottom: var(--border-thick);
  padding-bottom: var(--spacing-lg);
  gap: var(--spacing-lg);
  z-index: 1;
}

.header-content {
  position: relative;
  z-index: 10; /* Ensure text is above the GIF */
}

@media (max-width: 768px) {
  .forum-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

@media (max-width: 600px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
  z-index: 1; /* Stacking context for the gif */
}

.forum-rice-gif {
  position: absolute;
  top: -65px; /* Above the input box */
  right: 0;
  width: 100px;
  height: auto;
  pointer-events: none;
  z-index: -1; /* Behind the search input */
}

@media (max-width: 768px) {
  .forum-rice-gif {
    top: -55px; /* Stay glued to the box */
    width: 100px; /* Constant size */
    opacity: 1;
    z-index: -1; 
  }
}

@media (max-width: 600px) {
  .forum-rice-gif {
    top: -60px;
    right: 20px;
    opacity: 1;
    z-index: -1;
  }
}

.search-input {
  position: relative;
  z-index: 2; /* In front of the gif */
  width: 100%;
  padding: 10px 15px;
  font-family: var(--font-body);
  font-size: var(--font-size-md);
  border: var(--border-thick);
  background: var(--color-white-snow);
  color: var(--color-black-carbon);
  box-shadow: var(--shadow-offset-sm);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  outline: none;
}

.search-input:focus {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-offset-md);
  border-color: var(--color-primary);
}

.forum-title {
  font-size: var(--font-size-xxl);
  margin-bottom: var(--spacing-xs);
  color: var(--color-black-carbon);
}

.forum-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-black-carbon);
  opacity: 0.8;
  margin: 0;
}

.create-section {
  margin-bottom: var(--spacing-xxl);
  animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading, .empty-state {
  text-align: center;
  padding: var(--spacing-xxl);
  font-family: var(--font-heading);
  text-transform: uppercase;
  border: var(--border-thick);
  background: var(--color-white-snow);
  box-shadow: var(--shadow-offset-md);
}

.auth-notice-banner {
  margin-bottom: var(--spacing-xxl);
  padding: var(--spacing-lg);
  text-align: center;
  background-color: var(--color-white-snow);
  border: var(--border-thick);
  font-family: var(--font-heading);
  letter-spacing: 1px;
}

.auth-link {
  color: var(--color-primary);
  text-decoration: underline;
  font-weight: var(--font-weight-black);
}

.auth-link:hover {
  filter: brightness(0.9);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xxl);
  margin-bottom: var(--spacing-lg);
}

.page-button {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-white-snow);
  border: var(--border-thick);
  font-family: var(--font-heading);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-md);
  cursor: pointer;
  box-shadow: var(--shadow-offset-sm);
  transition: all 0.1s ease;
  color: var(--color-black-carbon);
}

.page-button:hover:not(.active) {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-offset-md);
  border-color: var(--color-primary);
}

.page-button:active:not(.active) {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 var(--color-black-carbon);
}

.page-button.active {
  background-color: var(--color-primary);
  color: var(--color-white-snow);
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-offset-md);
}
</style>
