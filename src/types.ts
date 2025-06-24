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