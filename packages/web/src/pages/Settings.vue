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
  if (!confirm('Are you sure you want to delete this site?')) return;
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
      <p v-if="sites.length === 0" class="empty-hint">No sites added yet. Add one below.</p>
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
      <p v-if="interests.length === 0" class="empty-hint">No interests yet. Add keywords to personalize recommendations.</p>
      <div class="add-form">
        <input v-model="newKeyword" placeholder="Add keyword..." @keydown.enter="addInterest" />
        <button @click="addInterest">Add</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings { max-width: 800px; margin: 0 auto; padding: 24px 16px; background: var(--color-surface); min-height: 100vh; box-shadow: var(--shadow-md); }
.settings-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border); }
.settings-header a { color: var(--color-primary); font-weight: 500; }
.settings-header h1 { margin: 0; color: var(--color-text); }
.section { margin-bottom: 36px; }
.section h2 { font-size: 16px; margin-bottom: 14px; color: var(--color-text); border-left: 3px solid var(--color-primary); padding-left: 10px; }
.site-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--color-border-light); }
.site-name { font-weight: 500; flex: 1; color: var(--color-text); }
.site-adapter {
  font-size: 11px; color: var(--color-secondary); font-weight: 500;
  background: var(--color-secondary-light); padding: 2px 8px; border-radius: 10px;
}
.add-form { display: flex; gap: 8px; margin-top: 14px; }
.add-form input {
  flex: 1; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px;
  background: var(--color-surface);
}
.add-form input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1); }
.add-form select { padding: 8px; border: 1px solid var(--color-border); border-radius: 6px; }
.add-form button {
  padding: 8px 18px; cursor: pointer; border: none; border-radius: 6px;
  background: var(--color-primary); color: white; font-weight: 500;
  transition: background 0.15s;
}
.add-form button:hover { background: var(--color-primary-hover); }
.site-row button {
  padding: 4px 12px; border: 1px solid var(--color-border); border-radius: 6px;
  background: var(--color-surface); cursor: pointer; font-size: 12px;
  transition: all 0.15s;
}
.site-row button:hover { background: var(--color-primary-light); border-color: var(--color-primary); }
.interests-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.danger { color: var(--color-error) !important; border-color: var(--color-error) !important; }
.danger:hover { background: var(--color-error-bg) !important; }
.empty-hint { color: var(--color-text-muted); font-size: 13px; padding: 16px 0; }
</style>
