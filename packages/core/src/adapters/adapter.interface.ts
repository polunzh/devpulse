export interface RawPost {
  externalId: string;
  title: string;
  summary?: string;
  url: string;
  author?: string;
  score: number;
  publishedAt?: Date;
}

export interface SiteConfig {
  [key: string]: string;
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required?: boolean;
  defaultValue?: string;
  options?: { label: string; value: string }[];
}

export interface Adapter {
  name: string;
  displayName: string;
  fetchPosts(config: SiteConfig): Promise<RawPost[]>;
  configSchema?: ConfigField[];
}
