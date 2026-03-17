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
  <div class="site-filter">
    <button
      :class="{ active: !activeSiteId }"
      @click="emit('select', null)"
    >All</button>
    <button
      v-for="site in sites"
      :key="site.id"
      :class="{ active: activeSiteId === site.id }"
      @click="emit('select', site.id)"
    >{{ site.name }}</button>
  </div>
</template>

<style scoped>
.site-filter { display: flex; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #eee; flex-wrap: wrap; }
.site-filter button {
  padding: 4px 12px; border: 1px solid #ddd; border-radius: 16px;
  background: white; cursor: pointer; font-size: 13px;
}
.site-filter button.active { background: #0969da; color: white; border-color: #0969da; }
</style>
