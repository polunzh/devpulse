<script setup lang="ts">
const props = defineProps<{
  post: {
    id: string;
    title: string;
    url: string;
    author?: string;
    score: number;
    aiScore?: number;
    aiReason?: string;
    siteName?: string;
    publishedAt?: string;
    isRead: boolean;
  };
}>();

const emit = defineEmits<{
  read: [id: string];
  ignore: [id: string];
}>();

function handleClick() {
  emit('read', props.post.id);
  window.open(props.post.url, '_blank');
}

function handleIgnore() {
  emit('ignore', props.post.id);
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
</script>

<template>
  <div class="post-item" :class="{ read: post.isRead }" role="link" tabindex="0" @click="handleClick" @keydown.enter="handleClick">
    <div class="post-main">
      <h3 class="post-title">{{ post.title }}</h3>
      <div class="post-meta">
        <span class="post-source" v-if="post.siteName">{{ post.siteName }}</span>
        <span class="post-score">▲ {{ post.score }}</span>
        <span class="post-author" v-if="post.author">by {{ post.author }}</span>
        <span class="post-time">{{ timeAgo(post.publishedAt) }}</span>
      </div>
      <p class="post-reason" v-if="post.aiReason">{{ post.aiReason }}</p>
    </div>
    <div class="post-actions">
      <button class="ignore-button" type="button" @click.stop="handleIgnore" @keydown.stop>
        Not interested
      </button>
    </div>
  </div>
</template>

<style scoped>
.post-item {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.post-item:hover { background: var(--color-primary-light); }
.post-item:focus-visible { outline: 2px solid var(--color-primary); outline-offset: -2px; }
.post-main { min-width: 0; flex: 1; }
.post-item.read {
  opacity: 0.6;
  background: var(--color-bg);
}
.post-item.read .post-title {
  color: var(--color-text-secondary);
}
.post-title { margin: 0 0 5px; font-size: 15px; font-weight: 500; color: var(--color-text); line-height: 1.4; }
.post-meta { font-size: 12px; color: var(--color-text-secondary); display: flex; gap: 12px; align-items: center; }
.post-source {
  color: var(--color-secondary);
  font-weight: 600;
  background: var(--color-secondary-light);
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
}
.post-score { color: var(--color-primary); font-weight: 600; }
.post-author { color: var(--color-text-muted); }
.post-time { color: var(--color-text-muted); }
.post-reason {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 6px 0 0;
  padding-left: 8px;
  border-left: 2px solid var(--color-accent);
}
.post-actions {
  flex-shrink: 0;
  align-self: center;
}
.ignore-button {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.ignore-button:hover {
  border-color: var(--color-error);
  color: var(--color-error);
  background: var(--color-error-bg);
}

@media (max-width: 640px) {
  .post-item {
    flex-direction: column;
    align-items: stretch;
  }

  .post-actions {
    align-self: flex-start;
  }
}
</style>
