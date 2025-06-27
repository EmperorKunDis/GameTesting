# GameTester

Automated text-based adventure game exploration tool using Puppeteer. Systematically maps game narratives and generates comprehensive reports.

## Features

- **Automated Web Scraping**: Uses Puppeteer to systematically navigate through text-based games
- **Intelligent State Detection**: Advanced content hashing prevents infinite loops while ensuring complete exploration
- **Comprehensive Game Mapping**: Builds complete tree structure of all game paths and choices
- **Enhanced DOM Detection**: Multiple fallback selectors work with various game frameworks
- **Robust Error Handling**: Automatic recovery from navigation failures and page reload issues
- **Detailed Reporting**: Generates both JSON data and human-readable exploration reports
- **Czech Language Support**: Designed for Czech text-based adventure games

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd GameTester

# Install dependencies
npm install
```

## Usage

1. Start the game explorer:
```bash
npm start
```

2. Enter the URL of your text-based adventure game when prompted

3. The tool will automatically:
   - Open a browser window (visible for monitoring)
   - Systematically click through all available choices
   - Track visited states and build a complete game map
   - Generate detailed reports

## Output Files

- `game_exploration_results.json` - Complete structured data with game tree, state history, and choice tracking
- `game_exploration_report.txt` - Human-readable summary in Czech with exploration statistics

## Configuration

The tool includes comprehensive DOM selectors that work with most text-based games. For custom games, you can modify the selectors in `game-explorer.js`:

**Story Text Selectors**:
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

## Architecture

- **GameExplorer Class**: Main exploration engine with recursive state traversal
- **State Management**: Hash-based deduplication with path-aware state tracking
- **Navigation System**: Multiple click mechanisms with automatic fallback and recovery
- **Content Extraction**: Tree-walker algorithm captures complete page content for accurate state identification

## Browser Compatibility

- Runs with Puppeteer's bundled Chromium
- Compatible with both older and newer Puppeteer versions
- Non-headless mode for visual monitoring of exploration progress

## Contributing

This tool is designed for educational game testing and analysis. Feel free to submit issues or pull requests for improvements.

## License

MIT