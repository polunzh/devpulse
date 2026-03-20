<script setup lang="ts">
defineProps<{
  sites: { id: string; name: string }[];
  activeSiteId: string | null;
}>();

const emit = defineEmits<{
  select: [siteId: string | null];
}>();
</script>

<template>
  <div class="site-filter" role="group" aria-label="Filter by site">
    <button
      :class="{ active: !activeSiteId }"
      :aria-pressed="!activeSiteId"
      @click="emit('select', null)"
    >All</button>
    <button
      v-for="site in sites"
      :key="site.id"
      :class="{ active: activeSiteId === site.id }"
      :aria-pressed="activeSiteId === site.id"
      @click="emit('select', site.id)"
    >{{ site.name }}</button>
  </div>
</template>

<style scoped>
.site-filter { display: flex; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--color-border-light); flex-wrap: wrap; background: var(--color-surface); }
.site-filter button {
  padding: 5px 14px; border: 1px solid var(--color-border); border-radius: 16px;
  background: var(--color-surface); cursor: pointer; font-size: 13px; color: var(--color-text-secondary);
  transition: all 0.15s;
}
.site-filter button:hover:not(.active) { background: var(--color-primary-light); border-color: var(--color-primary); color: var(--color-primary); }
.site-filter button.active { background: var(--color-primary); color: white; border-color: var(--color-primary); font-weight: 500; }
.site-filter button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
</style>
