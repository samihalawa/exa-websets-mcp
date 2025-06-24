// Configuration for API
export const API_CONFIG = {
  BASE_URL: 'https://api.exa.ai',
  ENDPOINTS: {
    SEARCH: '/search',
    CONTENTS: '/contents',
    FIND_SIMILAR: '/findSimilar',
    ANSWER: '/answer',
    RESEARCH: '/research/v0/tasks',
    RESEARCH_STATUS: '/research/v0/tasks/:taskId'
  },
  DEFAULT_NUM_RESULTS: 5,
  DEFAULT_MAX_CHARACTERS: 3000,
  DEFAULT_HIGHLIGHTS_SENTENCES: 3,
  DEFAULT_SUBPAGES_MAX: 3,
  REQUEST_TIMEOUT: 25000
} as const; 