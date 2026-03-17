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
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 12px; font-size: 13px;
  background: #e8f0fe; color: #1a73e8;
}
.interest-tag.learned { background: #fef3e0; color: #e67700; }
.weight { font-size: 11px; opacity: 0.7; }
.remove { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.5; padding: 0; }
.remove:hover { opacity: 1; }
</style>
