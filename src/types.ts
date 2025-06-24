// Exa API Types

// Content options shared across multiple endpoints
export interface ContentOptions {
  text?: {
    maxCharacters?: number;
    includeHtmlTags?: boolean;
  } | boolean;
  highlights?: {
    numSentences?: number;
    highlightsPerUrl?: number;
    query?: string;
  } | boolean;
  summary?: {
    query?: string;
  } | boolean;
  livecrawl?: 'always' | 'fallback' | 'preferred' | 'never';
  subpages?: {
    max?: number;
    includePatterns?: string[];
    excludePatterns?: string[];
  };
  extras?: {
    links?: boolean;
    imageLinks?: boolean;
  };
}

// Search Request Types
export interface ExaSearchRequest {
  query: string;
  type?: 'neural' | 'keyword' | 'auto';
  category?: 'company' | 'research paper' | 'news' | 'pdf' | 'github' | 'tweet' | 'personal site' | 'linkedin profile' | 'financial report';
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startCrawlDate?: string;
  endCrawlDate?: string;
  startPublishedDate?: string;
  endPublishedDate?: string;
  includeText?: string;
  excludeText?: string;
  contents?: ContentOptions;
}

// Contents Request Types
export interface ExaContentsRequest {
  urls: string[];
  text?: {
    maxCharacters?: number;
    includeHtmlTags?: boolean;
  } | boolean;
  highlights?: {
    numSentences?: number;
    highlightsPerUrl?: number;
    query?: string;
  } | boolean;
  summary?: {
    query?: string;
  } | boolean;
  livecrawl?: 'always' | 'fallback' | 'never';
  subpages?: {
    max?: number;
    includePatterns?: string[];
    excludePatterns?: string[];
  };
  extras?: {
    links?: boolean;
    imageLinks?: boolean;
  };
}

// Find Similar Request Types
export interface ExaFindSimilarRequest {
  url: string;
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startCrawlDate?: string;
  endCrawlDate?: string;
  startPublishedDate?: string;
  endPublishedDate?: string;
  excludeSourceDomain?: boolean;
  category?: string;
  contents?: ContentOptions;
}

// Answer Request Types
export interface ExaAnswerRequest {
  query: string;
  text?: boolean;
  stream?: boolean;
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startCrawlDate?: string;
  endCrawlDate?: string;
  startPublishedDate?: string;
  endPublishedDate?: string;
  includeText?: string;
  excludeText?: string;
  category?: string;
}

// Research Request Types
export interface ExaResearchRequest {
  query: string;
  outputSchema?: Record<string, any>;
  llmGenerateSchema?: boolean;
  report?: boolean;
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
  category?: string;
}

// Response Types
export interface ExaSearchResult {
  id: string;
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text?: string;
  highlights?: string[];
  summary?: string;
  image?: string;
  favicon?: string;
  score?: number;
  links?: string[];
  imageLinks?: string[];
}

export interface ExaContentResult {
  url: string;
  title?: string;
  text?: string;
  highlights?: string[];
  summary?: string;
  author?: string;
  publishedDate?: string;
  links?: string[];
  imageLinks?: string[];
  error?: string;
  status?: 'success' | 'error';
}

export interface ExaSearchResponse {
  requestId: string;
  autopromptString?: string;
  resolvedSearchType?: string;
  results: ExaSearchResult[];
}

export interface ExaContentsResponse {
  requestId: string;
  results: ExaContentResult[];
  statuses?: Array<{
    url: string;
    status: 'success' | 'error';
    error?: string;
  }>;
}

export interface ExaAnswerResponse {
  requestId: string;
  answer: string;
  citations: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

export interface ExaResearchResponse {
  requestId: string;
  taskId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    report?: string;
    data?: Record<string, any>;
  };
  error?: string;
}

// Legacy types for backward compatibility
export interface ExaCrawlRequest {
  ids: string[];
  text: boolean;
  livecrawl?: 'always' | 'fallback' | 'preferred';
}

// Tool Argument Types
export interface SearchArgs {
  query: string;
  numResults?: number;
  livecrawl?: 'always' | 'fallback' | 'preferred';
}

// ============================================
// Websets API Types
// ============================================

// Webset Types
export interface Webset {
  id: string;
  object: 'webset';
  status: 'created' | 'idle' | 'running' | 'paused' | 'completed' | 'canceled' | 'error';
  externalId?: string | null;
  searches?: WebsetSearch[];
  enrichments?: WebsetEnrichment[];
  monitors?: Monitor[];
  imports?: Import[];
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface WebsetItem {
  id: string;
  object: 'webset_item';
  websetId: string;
  url: string;
  title?: string | null;
  content?: string | null;
  type?: string | null;
  verification?: {
    status: 'verified' | 'pending' | 'failed';
    reasoning?: string | null;
    references?: string[];
  };
  enrichedData?: Record<string, any>;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface WebsetSearch {
  id: string;
  object: 'webset_search';
  status: 'created' | 'running' | 'completed' | 'canceled' | 'error';
  query: string;
  entity?: {
    type: 'company' | 'person' | 'article' | 'research_paper' | 'custom';
  };
  criteria?: Criterion[];
  count?: number;
  behavior?: 'override' | 'append';
  progress?: {
    found: number;
    completion: number;
  };
  metadata?: Record<string, string>;
  canceledAt?: string | null;
  canceledReason?: 'user_request' | 'webset_deleted' | 'webset_canceled' | 'error' | 'timeout' | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebsetEnrichment {
  id: string;
  object: 'webset_enrichment';
  status: 'pending' | 'running' | 'completed' | 'canceled' | 'error';
  websetId: string;
  title?: string | null;
  description: string;
  format: 'text' | 'date' | 'number' | 'options' | 'email' | 'phone';
  options?: Array<{ label: string }> | null;
  instructions?: string | null;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Import {
  id: string;
  object: 'import';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  sourceUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  websetId?: string | null;
  itemCount?: number | null;
  errorDetails?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Monitor {
  id: string;
  object: 'monitor';
  websetId: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  cadence: string;
  query?: string | null;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  searchBehavior?: 'override' | 'append';
  createdAt: string;
  updatedAt: string;
}

export interface MonitorRun {
  id: string;
  object: 'monitor_run';
  monitorId: string;
  status: 'started' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string | null;
  itemsFound?: number | null;
}

export interface Webhook {
  id: string;
  object: 'webhook';
  url: string;
  events: EventType[];
  secret?: string;
  status: 'active' | 'inactive' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface WebhookAttempt {
  id: string;
  object: 'webhook_attempt';
  eventId: string;
  eventType: EventType;
  webhookId: string;
  url: string;
  successful: boolean;
  responseHeaders?: Record<string, string>;
  responseBody?: string | null;
  responseStatusCode?: number;
  attempt: number;
  attemptedAt: string;
}

export interface Event {
  id: string;
  object: 'event';
  type: EventType;
  websetId?: string | null;
  resourceId?: string | null;
  data?: Record<string, any>;
  createdAt: string;
}

// Input Types for Websets API
export interface WebsetSearchInput {
  query: string;
  count?: number;
  entity?: {
    type: 'company' | 'person' | 'article' | 'research_paper' | 'custom';
  };
  criteria?: CriterionInput[];
  behavior?: 'override' | 'append';
}

export interface Criterion {
  description: string;
}

export interface CriterionInput {
  description: string;
}

export interface WebsetEnrichmentInput {
  description: string;
  format?: 'text' | 'date' | 'number' | 'options' | 'email' | 'phone';
  options?: Array<{ label: string }>;
  metadata?: Record<string, string>;
}

export interface CreateWebsetInput {
  search?: WebsetSearchInput;
  enrichments?: WebsetEnrichmentInput[];
  externalId?: string | null;
  metadata?: Record<string, string>;
}

export interface UpdateWebsetInput {
  externalId?: string | null;
  metadata?: Record<string, string>;
  status?: 'paused' | 'running';
}

export interface ImportInput {
  sourceUrl: string;
  fileType?: 'csv' | 'json' | 'txt';
  websetId?: string | null;
  metadata?: Record<string, string>;
}

export interface UpdateImportInput {
  status?: 'canceled';
}

export interface CreateMonitorInput {
  websetId: string;
  cadence: 'daily' | 'weekly' | 'monthly' | 'hourly';
  query?: string | null;
  searchBehavior?: 'override' | 'append';
  metadata?: Record<string, string>;
}

export interface UpdateMonitorInput {
  cadence?: 'daily' | 'weekly' | 'monthly' | 'hourly';
  query?: string | null;
  status?: 'active' | 'paused';
  searchBehavior?: 'override' | 'append';
  metadata?: Record<string, string>;
}

export interface CreateWebhookInput {
  url: string;
  events: EventType[];
  description?: string | null;
  secret?: string | null;
}

export interface UpdateWebhookInput {
  url?: string;
  events?: EventType[];
  description?: string | null;
  status?: 'active' | 'inactive';
}

// Event Types
export type EventType =
  | 'webset.created'
  | 'webset.deleted'
  | 'webset.paused'
  | 'webset.idle'
  | 'webset.search.created'
  | 'webset.search.updated'
  | 'webset.search.completed'
  | 'webset.search.canceled'
  | 'webset.item.created'
  | 'webset.item.enriched'
  | 'import.created'
  | 'import.completed'
  | 'import.processing'
  | 'webset.export.created'
  | 'webset.export.completed'
  | 'webset.monitor.run.started'
  | 'webset.monitor.run.completed'
  | 'webset.monitor.run.failed';

// Response Types
export interface PaginatedList<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string | null;
}

export type PaginatedWebsetList = PaginatedList<Webset>;
export type PaginatedWebsetItemList = PaginatedList<WebsetItem>;
export type PaginatedImportList = PaginatedList<Import>;
export type PaginatedMonitorList = PaginatedList<Monitor>;
export type PaginatedWebhookList = PaginatedList<Webhook>;
export type PaginatedWebhookAttemptList = PaginatedList<WebhookAttempt>;
export type PaginatedEventList = PaginatedList<Event>;