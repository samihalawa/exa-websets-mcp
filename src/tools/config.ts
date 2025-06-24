// Configuration for API
export const API_CONFIG = {
  BASE_URL: 'https://api.exa.ai',
  ENDPOINTS: {
    // Search API endpoints
    SEARCH: '/search',
    CONTENTS: '/contents',
    FIND_SIMILAR: '/findSimilar',
    ANSWER: '/answer',
    RESEARCH: '/research/v0/tasks',
    RESEARCH_STATUS: '/research/v0/tasks/:taskId',
    
    // Websets API endpoints
    WEBSETS: '/websets/v0/websets',
    WEBSET_BY_ID: '/websets/v0/websets/:websetId',
    WEBSET_CANCEL: '/websets/v0/websets/:websetId/cancel',
    WEBSET_ITEMS: '/websets/v0/websets/:websetId/items',
    WEBSET_ITEM_BY_ID: '/websets/v0/websets/:websetId/items/:itemId',
    WEBSET_SEARCHES: '/websets/v0/websets/:websetId/searches',
    WEBSET_SEARCH_BY_ID: '/websets/v0/websets/:websetId/searches/:searchId',
    WEBSET_SEARCH_CANCEL: '/websets/v0/websets/:websetId/searches/:searchId/cancel',
    WEBSET_ENRICHMENTS: '/websets/v0/websets/:websetId/enrichments',
    WEBSET_ENRICHMENT_BY_ID: '/websets/v0/websets/:websetId/enrichments/:enrichmentId',
    WEBSET_ENRICHMENT_CANCEL: '/websets/v0/websets/:websetId/enrichments/:enrichmentId/cancel',
    IMPORTS: '/websets/v0/imports',
    IMPORT_BY_ID: '/websets/v0/imports/:importId',
    WEBSET_MONITORS: '/websets/v0/websets/:websetId/monitors',
    WEBSET_MONITOR_BY_ID: '/websets/v0/websets/:websetId/monitors/:monitorId',
    WEBSET_MONITOR_RUNS: '/websets/v0/websets/:websetId/monitors/:monitorId/runs',
    WEBHOOKS: '/websets/v0/webhooks',
    WEBHOOK_BY_ID: '/websets/v0/webhooks/:webhookId',
    WEBHOOK_ATTEMPTS: '/websets/v0/webhooks/:webhookId/attempts',
    EVENTS: '/websets/v0/events',
    EVENT_BY_ID: '/websets/v0/events/:eventId'
  },
  DEFAULT_NUM_RESULTS: 5,
  DEFAULT_MAX_CHARACTERS: 3000,
  DEFAULT_HIGHLIGHTS_SENTENCES: 3,
  DEFAULT_SUBPAGES_MAX: 3,
  REQUEST_TIMEOUT: 25000,
  WEBSETS_DEFAULT_COUNT: 10,
  WEBSETS_DEFAULT_LIMIT: 25,
  WEBSETS_MAX_LIMIT: 200
} as const; 