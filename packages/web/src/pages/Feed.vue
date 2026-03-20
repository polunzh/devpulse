<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api/client';
import PostItem from '../components/PostItem.vue';
import SiteFilter from '../components/SiteFilter.vue';

const route = useRoute();
const router = useRouter();

const posts = ref<any[]>([]);
const sites = ref<any[]>([]);
const loading = ref(false);
const error = ref('');
const readIds = ref(new Set<string>());
const hidingIds = ref(new Set<string>());

// Read filters from URL query params, fallback to localStorage
const activeSiteId = ref<string | null>(
  (route.query.site as string) || localStorage.getItem('devpulse:siteId') || null
);
const hideRead = ref(
  route.query.hideRead === 'true' || localStorage.getItem('devpulse:hideRead') === 'true'
);
const sortBy = ref<'score' | 'time'>(
  (route.query.sort as 'score' | 'time') || (localStorage.getItem('devpulse:sortBy') as 'score' | 'time') || 'score'
);

// Sync filters to URL + localStorage
function syncFilters() {
  const query: Record<string, string> = {};
  if (activeSiteId.value) query.site = activeSiteId.value;
  if (hideRead.value) query.hideRead = 'true';
  if (sortBy.value !== 'score') query.sort = sortBy.value;
  router.replace({ query });

  if (activeSiteId.value) {
    localStorage.setItem('devpulse:siteId', activeSiteId.value);
  } else {
    localStorage.removeItem('devpulse:siteId');
  }
  localStorage.setItem('devpulse:hideRead', String(hideRead.value));
  localStorage.setItem('devpulse:sortBy', sortBy.value);
}

async function loadPosts() {
  loading.value = true;
  error.value = '';
  try {
    const params: Record<string, string> = { sortBy: sortBy.value };
    if (activeSiteId.value) params.siteId = activeSiteId.value;
    if (hideRead.value) params.unreadOnly = 'true';
    posts.value = await api.posts.list(params);
  } catch (e) {
    error.value = 'Failed to load posts. Please try again.';
  } finally {
    loading.value = false;
  }
}

async function handleRead(id: string) {
  readIds.value.add(id);
  try {
    await api.posts.markAsRead(id);
  } catch {
    // Silently fail - read state is already tracked locally
  }

  // If hideRead is on, animate the item out after a short delay
  if (hideRead.value) {
    setTimeout(() => {
      hidingIds.value.add(id);
      // Remove from list after animation completes
      setTimeout(() => {
        posts.value = posts.value.filter(p => p.id !== id);
        hidingIds.value.delete(id);
        readIds.value.delete(id);
      }, 400);
    }, 800);
  }
}

async function handleRefresh() {
  loading.value = true;
  error.value = '';
  try {
    await api.fetch.trigger(activeSiteId.value || undefined);
    await loadPosts();
  } catch (e) {
    error.value = 'Failed to fetch new posts. Please try again.';
    loading.value = false;
  }
}

function handleFilterChange() {
  syncFilters();
  loadPosts();
}

onMounted(async () => {
  sites.value = await api.sites.list();
  await loadPosts();
});

const displayPosts = computed(() =>
  posts.value.map(p => ({
    ...p,
    isRead: readIds.value.has(p.id),
    isHiding: hidingIds.value.has(p.id),
    siteName: sites.value.find((s: any) => s.id === p.siteId)?.name,
  }))
);
</script>

<template>
  <div class="feed">
    <header class="feed-header">
      <h1>DevPulse</h1>
      <div class="feed-actions">
        <label><input type="checkbox" v-model="hideRead" @change="handleFilterChange"> Hide read</label>
        <select v-model="sortBy" @change="handleFilterChange">
          <option value="score">By relevance</option>
          <option value="time">By time</option>
        </select>
        <button @click="handleRefresh" :disabled="loading">
          {{ loading ? 'Fetching...' : 'Refresh' }}
        </button>
        <router-link to="/settings">Settings</router-link>
      </div>
    </header>

    <SiteFilter
      :sites="sites"
      :active-site-id="activeSiteId"
      @select="(id) => { activeSiteId = id; handleFilterChange(); }"
    />

    <div v-if="error" class="error-bar" @click="error = ''">{{ error }} ✕</div>
    <div v-if="loading" class="loading-bar">Loading...</div>

    <div class="feed-list">
      <PostItem
        v-for="post in displayPosts"
        :key="post.id"
        :post="post"
        :class="{ 'post-hiding': post.isHiding }"
        @read="handleRead"
      />
      <p v-if="!loading && displayPosts.length === 0" class="empty">No posts yet. Add sites and fetch!</p>
    </div>
  </div>
</template>

<style scoped>
.feed { max-width: 800px; margin: 0 auto; }
.feed-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #eee; }
.feed-header h1 { margin: 0; font-size: 20px; }
.feed-actions { display: flex; align-items: center; gap: 12px; font-size: 13px; }
.feed-actions button { padding: 4px 12px; cursor: pointer; }
.feed-actions a { color: #0969da; text-decoration: none; }
.empty { text-align: center; color: #888; padding: 40px; }

.error-bar { padding: 8px 16px; background: #fef2f2; color: #dc2626; font-size: 13px; cursor: pointer; border-bottom: 1px solid #fecaca; }
.loading-bar { padding: 8px 16px; background: #eff6ff; color: #2563eb; font-size: 13px; border-bottom: 1px solid #bfdbfe; }

.post-hiding {
  animation: slideOut 0.4s ease-out forwards;
}

@keyframes slideOut {
  0% {
    opacity: 0.5;
    transform: translateX(0);
  }
  50% {
    opacity: 0.2;
    transform: translateX(30px);
  }
  100% {
    opacity: 0;
    height: 0;
    padding: 0;
    margin: 0;
    border: none;
    transform: translateX(60px);
    overflow: hidden;
  }
}

@media (max-width: 640px) {
  .feed-header { flex-wrap: wrap; gap: 8px; }
  .feed-actions { flex-wrap: wrap; }
  .feed-actions button, .feed-actions select { min-height: 36px; }
}
</style>
