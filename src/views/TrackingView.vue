<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useTrackingStore } from '@/stores/trackingStore';
import { useAuthStore } from '@/stores/authStore';
import { useNewsStore } from '@/stores/newsStore';
import { useScrollToTopOnUpdate } from '@/composables/useScroll';
import TrackingDashboard from '@/components/Tracking/TrackingDashboard.vue';
import TrackingFilters from '@/components/Tracking/TrackingFilters.vue';
import TrackingGrid from '@/components/Tracking/TrackingGrid.vue';
import ConfirmModal from '@/components/Common/ConfirmModal.vue';
import ProductionNotice from '@/components/Common/ProductionNotice.vue';

const isProduction = import.meta.env.PROD;
import type { TrackingRecord, WatchStatus } from '@/types/tracking';
import type { SavedNewsItem } from '@/types/news';

const trackingStore = useTrackingStore();
const authStore = useAuthStore();
const newsStore = useNewsStore();

// Modal state
const showRemoveModal = ref(false);
const itemToRemoveId = ref<number | null>(null);

// Filter states
const activeCategory = ref<'all' | 'anime' | 'manga'>('all');
const activeStatus = ref<'all' | WatchStatus>('all');

// Auto-scroll on filter changes
useScrollToTopOnUpdate(activeCategory);
useScrollToTopOnUpdate(activeStatus);
const sortOrder = ref<'newest' | 'score' | 'title'>('newest');

onMounted(async () => {
    if (authStore.user) {
        await trackingStore.loadUserTracking(Number(authStore.user.id));
        newsStore.loadSavedNews(Number(authStore.user.id));
    }
});

const filteredItems = computed(() => {
    let items = [...trackingStore.userTracking];

    // Filter by category
    if (activeCategory.value !== 'all') {
        items = items.filter(item => item.category === activeCategory.value);
    }

    // Filter by status
    if (activeStatus.value !== 'all') {
        items = items.filter(item => item.watchStatus === activeStatus.value);
    }

    // Sort
    if (sortOrder.value === 'score') {
        items.sort((a, b) => (b.personalScore || 0) - (a.personalScore || 0));
    } else if (sortOrder.value === 'title') {
        items.sort((a, b) => a.title.localeCompare(b.title));
    } else {
        // Newest
        items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }

    return items;
});

const handleUpdate = async (id: number, data: Partial<TrackingRecord>) => {
    await trackingStore.updateTracking(id, data);
};

const handleRemove = (id: number) => {
    itemToRemoveId.value = id;
    showRemoveModal.value = true;
};

const confirmRemove = async () => {
    if (itemToRemoveId.value !== null) {
        const item = trackingStore.userTracking.find(i => i.id === itemToRemoveId.value);
        if (item && authStore.user) {
            await trackingStore.removeFromTracking(Number(authStore.user.id), item.malId, item.category);
        }
        showRemoveModal.value = false;
        itemToRemoveId.value = null;
    }
};

const cancelRemove = () => {
    showRemoveModal.value = false;
    itemToRemoveId.value = null;
};

const pendingNews = computed<SavedNewsItem[]>(() =>
    newsStore.savedNews
        .filter((item) => item.status === 'pending')
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
);

const seenNews = computed<SavedNewsItem[]>(() =>
    newsStore.savedNews
        .filter((item) => item.status === 'seen')
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
);

const formatSavedDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

const setNewsStatus = (newsKey: string, status: 'pending' | 'seen'): void => {
    if (!authStore.user) return;
    newsStore.setSavedNewsStatusByKey(newsKey, status, Number(authStore.user.id));
};

const removeSavedNews = (newsKey: string): void => {
    if (!authStore.user) return;
    newsStore.removeSavedNewsByKey(newsKey, Number(authStore.user.id));
};
</script>

<template>
    <div class="tracking-view">
        <div class="container container-wide">
            <header class="tracking-header">
                <div class="header-main">
                    <span class="kanji-vertical">追跡日記</span>
                    <div class="title-group">
                        <h1 class="main-title">MI REGISTRO PERSONAL</h1>
                        <p class="subtitle">Gestiona tu colección y progreso de anime y manga.</p>
                    </div>
                </div>
            </header>

            <ProductionNotice 
                v-if="isProduction" 
                message="El sistema de seguimiento de anime/manga y el guardado de noticias requieren de un servidor activo para persistir los datos. Por ahora, esta función solo está operativa en el entorno de desarrollo local."
            />

            <TrackingDashboard :stats="trackingStore.stats" />

            <TrackingFilters 
                v-model:activeCategory="activeCategory"
                v-model:activeStatus="activeStatus"
                v-model:sortOrder="sortOrder"
            />

            <TrackingGrid 
                :items="filteredItems"
                :isLoading="trackingStore.isLoading"
                @update="handleUpdate"
                @remove="handleRemove"
            />

            <section class="saved-news-block border-thick shadow-md">
                <div class="saved-news-head">
                    <h2>MIS NOTICIAS GUARDADAS</h2>
                    <p>Gestiona lo pendiente y lo visto desde tu tracking.</p>
                </div>

                <div class="saved-news-columns">
                    <article class="saved-news-column border-thin">
                        <img src="@/assets/images/gif/boxcat.gif" alt="Box Cat" class="boxcat-gif">
                        <h3>PENDIENTES</h3>
                        <div v-if="pendingNews.length === 0" class="saved-news-empty border-thin">
                            No tienes noticias pendientes.
                        </div>
                        <div v-else class="saved-news-list">
                            <div v-for="item in pendingNews" :key="item.newsKey" class="saved-news-item border-thin">
                                <div class="saved-news-meta">
                                    <span class="source-badge">{{ item.source === 'anime' ? 'Anime' : 'Manga' }}</span>
                                    <span>{{ formatSavedDate(item.savedAt) }}</span>
                                </div>
                                <h4>{{ item.title }}</h4>
                                <p>{{ item.excerpt }}</p>
                                <div class="saved-news-actions">
                                    <button class="saved-btn" @click="setNewsStatus(item.newsKey, 'seen')">Marcar visto</button>
                                    <button class="saved-btn saved-btn-danger" @click="removeSavedNews(item.newsKey)">Quitar</button>
                                </div>
                            </div>
                        </div>
                    </article>

                    <article class="saved-news-column border-thin">
                        <h3>VISTAS</h3>
                        <div v-if="seenNews.length === 0" class="saved-news-empty border-thin">
                            Aún no tienes noticias marcadas como vistas.
                        </div>
                        <div v-else class="saved-news-list">
                            <div v-for="item in seenNews" :key="item.newsKey" class="saved-news-item border-thin">
                                <div class="saved-news-meta">
                                    <span class="source-badge">{{ item.source === 'anime' ? 'Anime' : 'Manga' }}</span>
                                    <span>{{ formatSavedDate(item.savedAt) }}</span>
                                </div>
                                <h4>{{ item.title }}</h4>
                                <p>{{ item.excerpt }}</p>
                                <div class="saved-news-actions">
                                    <button class="saved-btn" @click="setNewsStatus(item.newsKey, 'pending')">Mover a pendiente</button>
                                    <button class="saved-btn saved-btn-danger" @click="removeSavedNews(item.newsKey)">Quitar</button>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </section>
        </div>

        <!-- Confirm Removal Modal -->
        <ConfirmModal 
            :show="showRemoveModal"
            title="¿QUITAR DE LA LISTA?"
            message="¿Estás seguro de que quieres eliminar este ítem de tu registro personal? Esta acción no se puede deshacer."
            confirmText="ELIMINAR"
            cancelText="CANCELAR"
            @confirm="confirmRemove"
            @cancel="cancelRemove"
        />
    </div>
</template>

<style scoped>
.tracking-view {
    min-height: 100vh;
    padding: var(--spacing-xxl) var(--spacing-md);
    background-image: 
        linear-gradient(rgba(246, 247, 247, 0.85), rgba(255, 255, 255, 0.85)),
        url('@/assets/images/image/lineas4.jpg');
    background-attachment: fixed;
    background-size: cover;
    background-position: center;
}

.container {
    max-width: 1400px;
    margin: 0 auto;
}

.tracking-header {
    margin-bottom: var(--spacing-xl);
}

.header-main {
    display: flex;
    gap: var(--spacing-lg);
    align-items: center;
}

.kanji-vertical {
    writing-mode: vertical-rl;
    font-size: 2rem;
    font-weight: var(--font-weight-black);
    color: var(--color-primary);
    line-height: 1;
}

.main-title {
    font-family: var(--font-heading);
    font-size: 3.5rem;
    font-weight: var(--font-weight-black);
    letter-spacing: -2px;
    line-height: 0.9;
    margin-bottom: var(--spacing-xs);
    text-transform: uppercase;
}

.subtitle {
    font-family: var(--font-body);
    font-size: 1.1rem;
    color: #666;
    font-weight: 500;
}

.saved-news-block {
    margin-top: var(--spacing-xl);
    padding: var(--spacing-lg);
    background: var(--color-white-snow);
}

.saved-news-head {
    margin-bottom: var(--spacing-md);
}

.saved-news-head h2 {
    margin: 0 0 var(--spacing-xs);
    font-size: 1.4rem;
    text-transform: uppercase;
}

.saved-news-head p {
    margin: 0;
    font-size: var(--font-size-sm);
}

.saved-news-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
}

.saved-news-column {
    position: relative;
    background: #fefefe;
    padding: var(--spacing-md);
}

.boxcat-gif {
    position: absolute;
    top: -563px;
    right: -460px;
    width: 150px;
    height: auto;
    z-index: 5;
    pointer-events: none;
}

.saved-news-column h3 {
    margin: 0 0 var(--spacing-sm);
    text-transform: uppercase;
    font-size: var(--font-size-md);
}

.saved-news-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    max-height: 420px;
    overflow-y: auto;
    padding-right: 4px;
}

.saved-news-item {
    background: #fff;
    padding: var(--spacing-sm);
}

.saved-news-item h4 {
    margin: 0 0 6px;
    font-size: var(--font-size-sm);
}

.saved-news-item p {
    margin: 0 0 var(--spacing-sm);
    font-size: var(--font-size-xs);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.saved-news-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    font-size: 0.65rem;
    text-transform: uppercase;
    font-family: var(--font-heading);
}

.source-badge {
    border: var(--border-thin);
    padding: 2px 6px;
    background: var(--color-primary);
    color: var(--color-white-snow);
}

.saved-news-actions {
    display: flex;
    gap: 6px;
}

.saved-btn {
    border: var(--border-thin);
    background: var(--color-white-snow);
    padding: 6px 8px;
    font-size: 0.62rem;
    text-transform: uppercase;
    font-family: var(--font-heading);
    cursor: pointer;
}

.saved-btn-danger {
    background: var(--color-black-carbon);
    color: var(--color-white-snow);
}

.saved-news-empty {
    padding: var(--spacing-md);
    font-size: var(--font-size-sm);
    text-align: center;
    text-transform: uppercase;
    font-family: var(--font-heading);
}

@media (max-width: 768px) {
    .main-title {
        font-size: 2.5rem;
    }
    
    .kanji-vertical {
        display: none;
    }

    .saved-news-columns {
        grid-template-columns: 1fr;
    }

    .boxcat-gif {
        width: 60px;
        top: -35px;
        right: 5px;
    }
}
</style>
