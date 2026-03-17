import type { Adapter } from '../adapters/adapter.interface.js';
import type { PostService } from './post.service.js';
import type { SiteService } from './site.service.js';
import type { InterestService } from './interest.service.js';
import type { AiService } from './ai.service.js';

const BATCH_SIZE = 20;

export class FetcherService {
  constructor(
    private postService: PostService,
    private siteService: SiteService,
    private interestService: InterestService,
    private aiService: AiService | null,
    private getAdapter: (name: string) => Adapter | undefined,
  ) {}

  async fetchSite(siteId: string) {
    const site = this.siteService.getById(siteId);
    if (!site) throw new Error(`Site ${siteId} not found`);

    const adapter = this.getAdapter(site.adapter);
    if (!adapter) throw new Error(`Adapter ${site.adapter} not found`);

    const config = this.siteService.getConfigs(siteId);

    let rawPosts;
    try {
      rawPosts = await adapter.fetchPosts(config);
    } catch (error) {
      console.error(`Failed to fetch from ${site.name}:`, error);
      return;
    }

    this.postService.savePosts(siteId, rawPosts);

    // Update last_fetched_at
    this.siteService.update(siteId, { lastFetchedAt: new Date().toISOString() });

    // AI scoring in batches (skip if no AI service configured)
    if (!this.aiService) return;

    const interests = this.interestService.listAll();
    const savedPosts = this.postService.list({ siteId });
    const unscoredPosts = savedPosts.filter(p => p.aiScore === null);

    for (let i = 0; i < unscoredPosts.length; i += BATCH_SIZE) {
      const batch = unscoredPosts.slice(i, i + BATCH_SIZE);
      const inputs = batch.map(p => ({
        title: p.title,
        summary: p.summary || undefined,
        source: site.name,
      }));

      const scores = await this.aiService.scorePosts(
        inputs,
        interests.map(i => ({ keyword: i.keyword, weight: i.weight })),
      );

      for (const result of scores) {
        const post = batch[result.index];
        if (post) {
          this.postService.updateAiScore(post.id, result.score, result.reason, result.tags);
        }
      }
    }
  }

  async fetchAll() {
    const enabledSites = this.siteService.listEnabled();
    for (const site of enabledSites) {
      await this.fetchSite(site.id);
    }
  }
}
