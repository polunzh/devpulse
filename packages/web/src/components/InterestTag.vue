<script setup lang="ts">
defineProps<{
  interest: { id: string; keyword: string; weight: number; source: string };
}>();
const emit = defineEmits<{ remove: [id: string] }>();
</script>

<template>
  <span class="interest-tag" :class="interest.source">
    {{ interest.keyword }}
    <span class="weight">({{ interest.weight.toFixed(1) }})</span>
    <button class="remove" @click.stop="emit('remove', interest.id)">&times;</button>
  </span>
</template>

<style scoped>
.interest-tag {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 14px; font-size: 13px; font-weight: 500;
  background: var(--color-secondary-light); color: var(--color-secondary);
  transition: all 0.15s;
}
.interest-tag.learned { background: var(--color-primary-light); color: var(--color-primary-dark); }
.weight { font-size: 11px; opacity: 0.6; font-weight: 400; }
.remove { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.4; padding: 0; color: inherit; }
.remove:hover { opacity: 1; }
</style>
