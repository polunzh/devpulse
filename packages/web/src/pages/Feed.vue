<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '../api/client';
import PostItem from '../components/PostItem.vue';
import SiteFilter from '../components/SiteFilter.vue';

const posts = ref<any[]>([]);
const sites = ref<any[]>([]);
const activeSiteId = ref<string | null>(null);
const hideRead = ref(false);
const sortBy = ref<'score' | 'time'>('score');
const loading = ref(false);
const readIds = ref(new Set<string>());

async function loadPosts() {
  loading.value = true;
  const params: Record<string, string> = { sortBy: sortBy.value };
  if (activeSiteId.value) params.siteId = activeSiteId.value;
  if (hideRead.value) params.unreadOnly = 'true';
  posts.value = await api.posts.list(params);
  loading.value = false;
}

async function handleRead(id: string) {
  readIds.value.add(id);
  await api.posts.markAsRead(id);
}

async function handleRefresh() {
  loading.value = true;
  await api.fetch.trigger(activeSiteId.value || undefined);
  await loadPosts();
}

onMounted(async () => {
  sites.value = await api.sites.list();
  await loadPosts();
});

const displayPosts = computed(() =>
  posts.value.map(p => ({
    ...p,
    isRead: readIds.value.has(p.id),
    siteName: sites.value.find(s => s.id === p.siteId)?.name,
  }))
);
</script>

<template>
  <div class="feed">
    <header class="feed-header">
      <h1>DevPulse</h1>
      <div class="feed-actions">
        <label><input type="checkbox" v-model="hideRead" @change="loadPosts"> Hide read</label>
        <select v-model="sortBy" @change="loadPosts">
          <option value="score">By relevance</option>
          <option value="time">By time</option>
        </select>
        <button @click="handleRefresh" :disabled="loading">
          {{ loading ? 'Fetching...' : 'Refresh' }}
        </button>
        <router-link to="/settings">Settings</router-link>
      </div>
    </header>

    <SiteFilter :sites="sites" :active-site-id="activeSiteId" @select="(id) => { activeSiteId = id; loadPosts(); }" />

    <div class="feed-list">
      <PostItem
        v-for="post in displayPosts"
        :key="post.id"
        :post="post"
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
</style>
