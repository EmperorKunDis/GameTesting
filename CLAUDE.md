# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "GameTester" - an automated text-based adventure game exploration tool written in Node.js. The project uses Puppeteer to systematically navigate through web-based text adventures, mapping out all possible story paths and generating comprehensive exploration reports.

## Core Technologies
- **Runtime**: Node.js
- **Browser Automation**: Puppeteer (headless Chrome control)
- **File System**: Native Node.js `fs` for report generation
- **User Interface**: Command-line interface with `readline`

## Development Commands

```bash
# Install dependencies
npm install
# or specifically install Puppeteer
npm run install-deps

# Start the game explorer
npm start
# or directly
node start-game-explorer.js
```

## Architecture

### Core Components

**GameExplorer Class** (`game-explorer.js`):
- Main exploration engine with recursive state traversal
- Maintains `visitedStates` Map to prevent infinite loops
- Builds complete `gameTree` structure of all discovered paths
- Uses DOM selectors to identify story text and clickable options

**Interactive Launcher** (`start-game-explorer.js`):
- Command-line interface for URL input and user confirmation
- Error handling and user feedback
- Coordinates the exploration process

### State Management

The explorer uses a hash-based state identification system:
```javascript
// State tracking prevents infinite loops in branching narratives
visitedStates: Map<stateHash, stateData>
gameTree: Object // Hierarchical structure of story paths
currentPath: Array // Breadcrumb trail for current exploration
```

### DOM Interaction Strategy

The tool identifies interactive elements using broad CSS selectors:
- Story content: `.story-text, .game-text, p`
- Interactive options: `button, .option, [role="button"], a[href*="#"]`
- Filters out meta-elements (e.g., text containing "🤔 Co uděláte?")

### Output Generation

Creates two types of reports:
- **JSON format**: `game_exploration_results.json` - Complete structured data
- **Human-readable**: `game_exploration_report.txt` - Formatted summary in Czech

## Key Configuration

**Browser Settings**:
- Runs in non-headless mode (`headless: false`) for visual monitoring
- Default viewport: 1200x800px
- Navigation timeouts: 1.5-2 seconds between actions with fallback mechanisms

**Safety Limits**:
- Maximum exploration depth: 25 levels (prevents infinite recursion)
- Built-in state deduplication via normalized content hashing
- Robust error handling with automatic recovery attempts

**Debugging Features**:
- Detailed logging of exploration progress and state transitions
- Hash generation logging for troubleshooting duplicate detection
- Path tracking with breadcrumb display

## Customization Points

The tool now includes comprehensive selector arrays that should work with most games, but can be customized:

**Story Text Selectors** (in order of priority):
```javascript
'.story-text', '.game-text', '.content', '.main-text', 
'[class*="story"]', '[class*="text"]', '[class*="content"]',
'main p', 'article p', '.container p', 'div p'
```

**Interactive Element Selectors**:
```javascript
'button', '.option', '[role="button"]', 'a[href*="#"]', 'a[onclick]', 
'.choice', '.button', '[class*="option"]', '[class*="choice"]', 
'[class*="button"]', 'input[type="button"]', 'input[type="submit"]'
```

## Common Issues and Solutions

**Early Termination Problems**:
- Improved DOM element detection with multiple fallback selectors
- Enhanced navigation handling with URL tracking and page reload fallbacks
- Better state hashing prevents false positive duplicate detection

**Navigation Failures**:
- Multiple click mechanisms (click(), onclick(), href navigation)
- Automatic page reload if back navigation fails
- Timeout handling for both navigation and content loading

**Puppeteer Compatibility**:
- Uses `setTimeout` with Promise wrapper instead of deprecated `waitForTimeout`
- Compatible with both older and newer Puppeteer versions

## Czech Language Context

The tool is designed for Czech text-based games:
- All console output and reports are in Czech
- Filters Czech UI elements (e.g., "🤔 Co uděláte?" prompts)
- Report timestamps use Czech locale formatting