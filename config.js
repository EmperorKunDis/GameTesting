// Configuration file for Game Testing Tool
module.exports = {
  // Exploration limits
  exploration: {
    maxDepth: 50,           // Maximum exploration depth
    maxStates: 1000,        // Maximum number of states to explore
    timeoutMs: 30000,       // Timeout per page (milliseconds)
    waitBetweenActions: 1000, // Wait time between actions (ms)
    maxRetries: 3           // Maximum retries for failed actions
  },

  // Browser configuration
  browser: {
    headless: false,        // Set to true for headless mode
    viewport: {
      width: 1280,
      height: 720
    },
    blockResources: true,   // Block images, CSS, fonts for faster loading
    userAgent: 'GameTestingBot/2.0.0'
  },

  // Content selectors for different game types
  selectors: {
    // Common text adventure selectors
    storyText: [
      '.story-text', '.game-text', '.content', '.main-text',
      '[class*="story"]', '[class*="text"]', '[class*="content"]',
      'main p', 'article p', '.container p', 'div p',
      '#game-content', '#story', '#text', '.narrative'
    ],
    
    // Interactive elements (choices/buttons)
    choices: [
      'button', '.option', '[role="button"]', 'a[href*="#"]', 'a[onclick]',
      '.choice', '.button', '[class*="option"]', '[class*="choice"]',
      '[class*="button"]', 'input[type="button"]', 'input[type="submit"]',
      '.game-choice', '.story-choice', '.narrative-choice'
    ],

    // Game-specific selectors (customize for your games)
    custom: {
      // Example for Twine games
      twine: {
        story: '.passage',
        choices: 'tw-link'
      },
      
      // Example for Inform games
      inform: {
        story: '#gametext',
        choices: 'a.command'
      },
      
      // Example for custom games
      physics_adventure: {
        story: '.game-text, .story-content',
        choices: '.choice-button, .game-option'
      }
    }
  },

  // Quality thresholds for assessment
  quality: {
    branching: {
      min: 1.5,              // Minimum average branching factor
      max: 4.0,              // Maximum before it's too complex
      ideal: 2.5             // Ideal branching factor
    },
    
    deadEnds: {
      maxRatio: 0.3          // Maximum ratio of dead ends (30%)
    },
    
    content: {
      minWordsPerState: 30,  // Minimum words per state
      maxDuplicateRatio: 0.2 // Maximum duplicate content ratio (20%)
    },
    
    navigation: {
      maxLinearRatio: 0.6    // Maximum linear path ratio (60%)
    }
  },

  // Output configuration
  output: {
    generateJson: true,      // Generate JSON reports
    generateText: true,      // Generate text reports
    includeContent: true,    // Include full content in outputs
    truncateContent: 500,    // Truncate content to N characters
    language: 'cs'           // Report language (cs/en)
  },

  // Performance settings
  performance: {
    enableMetrics: true,     // Enable detailed metrics collection
    collectTimings: true,    // Collect timing information
    memoryThreshold: 512,    // Memory threshold in MB
    cleanupInterval: 100     // States before memory cleanup
  },

  // Debug and logging
  debug: {
    enabled: process.env.DEBUG === 'true',
    verbose: false,          // Verbose logging
    saveScreenshots: false,  // Save screenshots on errors
    logSelectors: false      // Log selector attempts
  },

  // Testing configuration
  testing: {
    defaultUrl: 'https://emperorkundis.github.io/physics-adventure-game/',
    testUrls: [
      'https://emperorkundis.github.io/physics-adventure-game/'
      // Add more test URLs here
    ],
    benchmarkRuns: 3,        // Number of benchmark runs
    acceptableTime: 300      // Acceptable test time (seconds)
  }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  module.exports.browser.headless = true;
  module.exports.debug.enabled = false;
  module.exports.performance.cleanupInterval = 50;
}

if (process.env.NODE_ENV === 'development') {
  module.exports.debug.verbose = true;
  module.exports.exploration.maxStates = 100; // Limit for development
}

// Game-specific configurations
module.exports.gameConfigs = {
  // Configuration for your physics adventure game
  'physics-adventure': {
    selectors: {
      story: '.game-text, .story-content, .narrative',
      choices: '.choice-btn, .option-button, button.choice'
    },
    limits: {
      maxDepth: 20,
      expectedStates: 15
    },
    quality: {
      expectedBranching: 2.0,
      maxDeadEnds: 5
    }
  },

  // Template for other games
  'generic-twine': {
    selectors: {
      story: '.passage',
      choices: 'tw-link, a.internalLink'
    },
    limits: {
      maxDepth: 30,
      expectedStates: 50
    }
  }
};

// Helper function to get game-specific config
module.exports.getGameConfig = function(gameType) {
  return {
    ...module.exports,
    ...module.exports.gameConfigs[gameType]
  };
};