export interface RawPost {
  externalId: string;
  title: string;
  summary?: string;
  url: string;
  author?: string;
  score?: number;
  publishedAt?: Date;
}
