<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { api } from '../api/client';
import InterestTag from '../components/InterestTag.vue';

interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required?: boolean;
  defaultValue?: string;
  options?: { label: string; value: string }[];
}

interface AdapterInfo {
  name: string;
  displayName: string;
  configSchema: ConfigField[];
}

const sites = ref<any[]>([]);
const interests = ref<any[]>([]);
const adapters = ref<AdapterInfo[]>([]);
const newKeyword = ref('');
const newSiteName = ref('');
const newSiteAdapter = ref('');
const newSiteConfig = ref<Record<string, string>>({});
const editingSiteId = ref<string | null>(null);
const editingConfig = ref<Record<string, string>>({});

const selectedAdapterSchema = computed(() => {
  return adapters.value.find(a => a.name === newSiteAdapter.value)?.configSchema || [];
});

const editingAdapterSchema = computed(() => {
  if (!editingSiteId.value) return [];
  const site = sites.value.find(s => s.id === editingSiteId.value);
  if (!site) return [];
  return adapters.value.find(a => a.name === site.adapter)?.configSchema || [];
});

watch(newSiteAdapter, () => {
  const schema = selectedAdapterSchema.value;
  const config: Record<string, string> = {};
  for (const field of schema) {
    if (field.defaultValue) config[field.key] = field.defaultValue;
  }
  newSiteConfig.value = config;
});

async function loadData() {
  [sites.value, interests.value, adapters.value] = await Promise.all([
    api.sites.list(),
    api.interests.list(),
    api.adapters.list(),
  ]);
  if (!newSiteAdapter.value && adapters.value.length > 0) {
    newSiteAdapter.value = adapters.value[0].name;
  }
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
  const config: Record<string, string> = {};
  for (const [k, v] of Object.entries(newSiteConfig.value)) {
    if (v) config[k] = v;
  }
  await api.sites.create({
    name: newSiteName.value.trim(),
    adapter: newSiteAdapter.value,
    config: Object.keys(config).length > 0 ? config : undefined,
  });
  newSiteName.value = '';
  newSiteConfig.value = {};
  await loadData();
}

async function toggleSite(site: any) {
  await api.sites.update(site.id, { enabled: site.enabled ? 0 : 1 });
  await loadData();
}

async function deleteSite(id: string) {
  if (!confirm('Are you sure you want to delete this site?')) return;
  await api.sites.delete(id);
  if (editingSiteId.value === id) editingSiteId.value = null;
  await loadData();
}

async function startEditing(siteId: string) {
  if (editingSiteId.value === siteId) {
    editingSiteId.value = null;
    return;
  }
  editingSiteId.value = siteId;
  const config = await api.sites.getConfig(siteId);
  // Merge schema defaults so select fields show meaningful values
  const schema = editingAdapterSchema.value;
  const merged: Record<string, string> = {};
  for (const field of schema) {
    if (field.defaultValue) merged[field.key] = field.defaultValue;
  }
  Object.assign(merged, config);
  editingConfig.value = merged;
}

async function saveConfig() {
  if (!editingSiteId.value) return;
  const config: Record<string, string> = {};
  for (const [k, v] of Object.entries(editingConfig.value)) {
    if (v) config[k] = v;
  }
  await api.sites.updateConfig(editingSiteId.value, config);
  editingSiteId.value = null;
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
        <div v-for="site in sites" :key="site.id" class="site-item">
          <div class="site-row">
            <span class="site-name">{{ site.name }}</span>
            <span class="site-adapter">{{ site.adapter }}</span>
            <button @click="startEditing(site.id)">{{ editingSiteId === site.id ? 'Cancel' : 'Configure' }}</button>
            <button @click="toggleSite(site)">{{ site.enabled ? 'Disable' : 'Enable' }}</button>
            <button class="danger" @click="deleteSite(site.id)">Delete</button>
          </div>
          <div v-if="editingSiteId === site.id" class="config-form">
            <template v-if="editingAdapterSchema.length > 0">
              <div v-for="field in editingAdapterSchema" :key="field.key" class="config-field">
                <label>{{ field.label }}<span v-if="field.required" class="required">*</span></label>
                <select v-if="field.type === 'select'" v-model="editingConfig[field.key]">
                  <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <input v-else :type="field.type" v-model="editingConfig[field.key]" :placeholder="field.defaultValue" />
              </div>
            </template>
            <p v-else class="empty-hint">No configuration needed.</p>
            <button class="save-btn" @click="saveConfig">Save</button>
          </div>
        </div>
      </div>
      <p v-if="sites.length === 0" class="empty-hint">No sites added yet. Add one below.</p>

      <div class="add-form">
        <input v-model="newSiteName" placeholder="Site name" />
        <select v-model="newSiteAdapter">
          <option v-for="a in adapters" :key="a.name" :value="a.name">{{ a.displayName }}</option>
        </select>
        <button @click="addSite">Add Site</button>
      </div>
      <div v-if="selectedAdapterSchema.length > 0" class="new-site-config">
        <div v-for="field in selectedAdapterSchema" :key="field.key" class="config-field">
          <label>{{ field.label }}<span v-if="field.required" class="required">*</span></label>
          <select v-if="field.type === 'select'" v-model="newSiteConfig[field.key]">
            <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <input v-else :type="field.type" v-model="newSiteConfig[field.key]" :placeholder="field.defaultValue" />
        </div>
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
.site-item { border-bottom: 1px solid var(--color-border-light); }
.site-item:last-child { border-bottom: none; }
.config-form { padding: 12px 0 12px 16px; border-left: 2px solid var(--color-primary-light); margin: 8px 0; }
.config-field { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.config-field label { min-width: 140px; font-size: 13px; color: var(--color-text-secondary); }
.config-field input, .config-field select {
  flex: 1; padding: 6px 10px; border: 1px solid var(--color-border); border-radius: 6px;
  background: var(--color-surface); font-size: 13px;
}
.config-field input:focus, .config-field select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1); }
.required { color: var(--color-error); margin-left: 2px; }
.save-btn {
  margin-top: 4px; padding: 6px 16px; border: none; border-radius: 6px;
  background: var(--color-primary); color: white; font-size: 13px; font-weight: 500; cursor: pointer;
}
.save-btn:hover { background: var(--color-primary-hover); }
.new-site-config { margin-top: 12px; padding: 12px; border: 1px dashed var(--color-border); border-radius: 8px; }
</style>
