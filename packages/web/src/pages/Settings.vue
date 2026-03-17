<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../api/client';
import InterestTag from '../components/InterestTag.vue';

const sites = ref<any[]>([]);
const interests = ref<any[]>([]);
const newKeyword = ref('');
const newSiteName = ref('');
const newSiteAdapter = ref('hackernews');

async function loadData() {
  sites.value = await api.sites.list();
  interests.value = await api.interests.list();
}

async function addInterest() {
  if (!newKeyword.value.trim()) return;
  await api.interests.add(newKeyword.value.trim());
  newKeyword.value = '';
  await loadData();
}

async function removeInterest(id: string) {
  await api.interests.remove(id);
  await loadData();
}

async function addSite() {
  if (!newSiteName.value.trim()) return;
  await api.sites.create({ name: newSiteName.value.trim(), adapter: newSiteAdapter.value });
  newSiteName.value = '';
  await loadData();
}

async function toggleSite(site: any) {
  await api.sites.update(site.id, { enabled: site.enabled ? 0 : 1 });
  await loadData();
}

async function deleteSite(id: string) {
  await api.sites.delete(id);
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <div class="settings">
    <header class="settings-header">
      <router-link to="/">&larr; Back</router-link>
      <h1>Settings</h1>
    </header>

    <section class="section">
      <h2>Sites</h2>
      <div class="site-list">
        <div v-for="site in sites" :key="site.id" class="site-row">
          <span class="site-name">{{ site.name }}</span>
          <span class="site-adapter">{{ site.adapter }}</span>
          <button @click="toggleSite(site)">{{ site.enabled ? 'Disable' : 'Enable' }}</button>
          <button class="danger" @click="deleteSite(site.id)">Delete</button>
        </div>
      </div>
      <div class="add-form">
        <input v-model="newSiteName" placeholder="Site name" />
        <select v-model="newSiteAdapter">
          <option value="hackernews">Hacker News</option>
          <option value="reddit">Reddit</option>
          <option value="v2ex">V2EX</option>
          <option value="medium">Medium</option>
        </select>
        <button @click="addSite">Add Site</button>
      </div>
    </section>

    <section class="section">
      <h2>Interests</h2>
      <div class="interests-list">
        <InterestTag
          v-for="interest in interests"
          :key="interest.id"
          :interest="interest"
          @remove="removeInterest"
        />
      </div>
      <div class="add-form">
        <input v-model="newKeyword" placeholder="Add keyword..." @keydown.enter="addInterest" />
        <button @click="addInterest">Add</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings { max-width: 800px; margin: 0 auto; padding: 16px; }
.settings-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.settings-header a { color: #0969da; text-decoration: none; }
.settings-header h1 { margin: 0; }
.section { margin-bottom: 32px; }
.section h2 { font-size: 16px; margin-bottom: 12px; }
.site-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #eee; }
.site-name { font-weight: 500; flex: 1; }
.site-adapter { font-size: 12px; color: #666; }
.add-form { display: flex; gap: 8px; margin-top: 12px; }
.add-form input { flex: 1; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; }
.add-form button { padding: 6px 16px; cursor: pointer; }
.interests-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.danger { color: #d32f2f; }
</style>
