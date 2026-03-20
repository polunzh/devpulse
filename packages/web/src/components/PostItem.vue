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
}>();

function handleClick() {
  emit('read', props.post.id);
  window.open(props.post.url, '_blank');
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
  </div>
</template>

<style scoped>
.post-item {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.15s;
}
.post-item:hover { background: #f8f9fa; }
.post-item:focus-visible { outline: 2px solid #0969da; outline-offset: -2px; }
.post-item.read {
  opacity: 0.65;
  background: #f5f5f5;
}
.post-item.read .post-title {
  color: #666;
}
.post-title { margin: 0 0 4px; font-size: 15px; font-weight: 500; }
.post-meta { font-size: 12px; color: #666; display: flex; gap: 12px; }
.post-source { color: #0969da; font-weight: 500; }
.post-score { color: #e67700; }
.post-reason { font-size: 13px; color: #888; margin: 4px 0 0; }
</style>
