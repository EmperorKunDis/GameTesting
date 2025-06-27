const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const crypto = require('crypto');

class GameMetrics {
  constructor() {
    this.gameMetrics = {
      totalStates: 0,
      totalChoices: 0,
      totalPaths: 0,
      maxDepth: 0,
      avgDepth: 0,
      branchingFactor: {
        min: Infinity,
        max: 0,
        avg: 0,
        distribution: new Map()
      },
      pathLengths: [],
      deadEnds: 0,
      loops: 0,
      textStats: {
        totalWords: 0,
        avgWordsPerState: 0,
        shortestText: Infinity,
        longestText: 0
      },
      explorationTime: 0,
      avgTimePerState: 0,
      statesWithNoChoices: 0,
      statesWithSingleChoice: 0,
      duplicateContent: 0,
      errorStates: 0
    };
    
    this.pathTracker = new Map();
    this.contentHashes = new Set();
    this.startTime = Date.now();
    this.stateDetails = [];
  }

  analyzeState(stateContent, choices, depth, stateHash, parentPath = [], isError = false) {
    if (isError) {
      this.gameMetrics.errorStates++;
      return;
    }

    this.gameMetrics.totalStates++;
    this.gameMetrics.maxDepth = Math.max(this.gameMetrics.maxDepth, depth);
    
    // Store detailed state info for advanced analysis
    this.stateDetails.push({
      hash: stateHash,
      depth: depth,
      choiceCount: choices.length,
      wordCount: this.countWords(stateContent),
      path: [...parentPath, stateHash]
    });
    
    // Analyze choices
    const choiceCount = choices.length;
    this.gameMetrics.totalChoices += choiceCount;
    
    // Branching factor analysis
    if (choiceCount > 0) {
      this.gameMetrics.branchingFactor.min = Math.min(this.gameMetrics.branchingFactor.min, choiceCount);
      this.gameMetrics.branchingFactor.max = Math.max(this.gameMetrics.branchingFactor.max, choiceCount);
      
      const current = this.gameMetrics.branchingFactor.distribution.get(choiceCount) || 0;
      this.gameMetrics.branchingFactor.distribution.set(choiceCount, current + 1);
    }
    
    // Dead end detection
    if (choiceCount === 0) {
      this.gameMetrics.deadEnds++;
      this.gameMetrics.statesWithNoChoices++;
      this.trackPath([...parentPath, stateHash], depth);
    } else if (choiceCount === 1) {
      this.gameMetrics.statesWithSingleChoice++;
    }
    
    // Content analysis
    const wordCount = this.countWords(stateContent);
    this.gameMetrics.textStats.totalWords += wordCount;
    this.gameMetrics.textStats.shortestText = Math.min(this.gameMetrics.textStats.shortestText, wordCount);
    this.gameMetrics.textStats.longestText = Math.max(this.gameMetrics.textStats.longestText, wordCount);
    
    // Duplicate content detection
    const contentHash = this.createContentHash(stateContent);
    if (this.contentHashes.has(contentHash)) {
      this.gameMetrics.duplicateContent++;
    } else {
      this.contentHashes.add(contentHash);
    }
  }

  trackPath(path, depth) {
    this.gameMetrics.totalPaths++;
    this.gameMetrics.pathLengths.push(depth);
    this.pathTracker.set(path.join('->'), depth);
  }

  countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  createContentHash(content) {
    if (!content) return 0;
    return content.toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      .split('')
      .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff, 0);
  }

  calculateFinalMetrics() {
    this.gameMetrics.explorationTime = Date.now() - this.startTime;
    const totalStates = this.gameMetrics.totalStates;
    
    if (totalStates > 0) {
      this.gameMetrics.avgDepth = this.gameMetrics.pathLengths.length > 0 
        ? this.gameMetrics.pathLengths.reduce((a, b) => a + b, 0) / this.gameMetrics.pathLengths.length 
        : 0;
      this.gameMetrics.branchingFactor.avg = this.gameMetrics.totalChoices / totalStates;
      this.gameMetrics.textStats.avgWordsPerState = this.gameMetrics.textStats.totalWords / totalStates;
      this.gameMetrics.avgTimePerState = this.gameMetrics.explorationTime / totalStates;
    }
    
    return this.gameMetrics;
  }

  generateReport() {
    const metrics = this.calculateFinalMetrics();
    
    return {
      summary: {
        totalStates: metrics.totalStates,
        totalPaths: metrics.totalPaths,
        explorationCompleteness: `${((metrics.totalPaths / Math.max(metrics.totalStates, 1)) * 100).toFixed(1)}%`,
        avgDepth: metrics.avgDepth.toFixed(1),
        maxDepth: metrics.maxDepth,
        errorStates: metrics.errorStates
      },
      
      structure: {
        branchingFactor: {
          min: metrics.branchingFactor.min === Infinity ? 0 : metrics.branchingFactor.min,
          max: metrics.branchingFactor.max,
          avg: metrics.branchingFactor.avg.toFixed(2),
          distribution: Object.fromEntries(metrics.branchingFactor.distribution)
        },
        deadEnds: metrics.deadEnds,
        linearPaths: metrics.statesWithSingleChoice,
        loops: metrics.loops
      },
      
      content: {
        avgWordsPerState: metrics.textStats.avgWordsPerState.toFixed(1),
        textRange: `${metrics.textStats.shortestText === Infinity ? 0 : metrics.textStats.shortestText} - ${metrics.textStats.longestText} words`,
        duplicateStates: metrics.duplicateContent,
        totalWords: metrics.textStats.totalWords
      },
      
      performance: {
        totalTime: `${(metrics.explorationTime / 1000).toFixed(1)}s`,
        avgTimePerState: `${metrics.avgTimePerState.toFixed(0)}ms`,
        explorationEfficiency: `${(metrics.totalStates / (metrics.explorationTime / 1000)).toFixed(1)} states/sec`
      },
      
      quality: {
        gameBalance: this.assessGameBalance(metrics),
        contentVariety: this.assessContentVariety(metrics),
        navigationFlow: this.assessNavigationFlow(metrics),
        overallScore: this.calculateOverallScore(metrics)
      },

      detailedAnalysis: {
        pathDistribution: this.analyzePathDistribution(),
        contentDistribution: this.analyzeContentDistribution(),
        depthAnalysis: this.analyzeDepthDistribution()
      }
    };
  }

  analyzePathDistribution() {
    const pathLengths = this.gameMetrics.pathLengths;
    if (pathLengths.length === 0) return null;
    
    pathLengths.sort((a, b) => a - b);
    const median = pathLengths[Math.floor(pathLengths.length / 2)];
    const q1 = pathLengths[Math.floor(pathLengths.length * 0.25)];
    const q3 = pathLengths[Math.floor(pathLengths.length * 0.75)];
    
    return { median, q1, q3, min: pathLengths[0], max: pathLengths[pathLengths.length - 1] };
  }

  analyzeContentDistribution() {
    const wordCounts = this.stateDetails.map(s => s.wordCount);
    if (wordCounts.length === 0) return null;
    
    wordCounts.sort((a, b) => a - b);
    const median = wordCounts[Math.floor(wordCounts.length / 2)];
    
    return {
      median,
      variance: this.calculateVariance(wordCounts),
      standardDeviation: Math.sqrt(this.calculateVariance(wordCounts))
    };
  }

  analyzeDepthDistribution() {
    const depthCounts = new Map();
    this.stateDetails.forEach(state => {
      const count = depthCounts.get(state.depth) || 0;
      depthCounts.set(state.depth, count + 1);
    });
    
    return Object.fromEntries(depthCounts);
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  }

  assessGameBalance(metrics) {
    const avgBranching = metrics.branchingFactor.avg;
    const deadEndRatio = metrics.deadEnds / Math.max(metrics.totalStates, 1);
    
    if (avgBranching < 1.5) return "Nízká - Málo možností";
    if (avgBranching > 4) return "Vysoká - Mnoho složitých rozhodnutí";
    if (deadEndRatio > 0.3) return "Nevyvážená - Příliš mnoho slepých uliček";
    return "Vyvážená";
  }

  assessContentVariety(metrics) {
    const duplicateRatio = metrics.duplicateContent / Math.max(metrics.totalStates, 1);
    const wordVariance = metrics.textStats.longestText - (metrics.textStats.shortestText === Infinity ? 0 : metrics.textStats.shortestText);
    
    if (duplicateRatio > 0.2) return "Nízká - Vysoké opakování obsahu";
    if (wordVariance < 50) return "Nízká - Podobné délky textů";
    return "Dobrá";
  }

  assessNavigationFlow(metrics) {
    const linearRatio = metrics.statesWithSingleChoice / Math.max(metrics.totalStates, 1);
    
    if (linearRatio > 0.6) return "Lineární - Omezená volba hráče";
    if (linearRatio < 0.2) return "Složitá - Vysoká kontrola hráče";
    return "Vyvážená";
  }

  calculateOverallScore(metrics) {
    let score = 100;
    
    // Deduct for poor balance
    const deadEndRatio = metrics.deadEnds / Math.max(metrics.totalStates, 1);
    if (deadEndRatio > 0.3) score -= 20;
    else if (deadEndRatio > 0.2) score -= 10;
    
    // Deduct for poor content variety
    const duplicateRatio = metrics.duplicateContent / Math.max(metrics.totalStates, 1);
    if (duplicateRatio > 0.2) score -= 15;
    else if (duplicateRatio > 0.1) score -= 8;
    
    // Deduct for poor branching
    if (metrics.branchingFactor.avg < 1.5) score -= 15;
    if (metrics.branchingFactor.avg > 4) score -= 10;
    
    // Deduct for errors
    if (metrics.errorStates > 0) score -= Math.min(20, metrics.errorStates * 5);
    
    return Math.max(0, score);
  }
}

class GameExplorer {
  constructor() {
    this.visitedStates = new Set();
    this.gameTree = {};
    this.stateHistory = [];
    this.metrics = new GameMetrics();
    this.maxDepth = 50; // Prevent infinite recursion
    this.maxStates = 1000; // Prevent runaway exploration
    this.timeoutMs = 30000; // 30 second timeout per page
  }

  async exploreGame(url) {
    let browser;
    try {
      console.log('🌐 Spouštím prohlížeč...');
      browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1280, height: 720 },
        timeout: this.timeoutMs
      });
      
      const page = await browser.newPage();
      
      // Set up page configuration
      await page.setDefaultTimeout(this.timeoutMs);
      await page.setDefaultNavigationTimeout(this.timeoutMs);
      
      // Block unnecessary resources for faster loading
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      console.log('📡 Načítám stránku...');
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      // Wait for any dynamic content to load
      await page.waitForTimeout(2000);
      
      console.log('🔍 Začínám průzkum hry...');
      await this.exploreState(page);
      
      const metricsReport = this.metrics.generateReport();
      
      // Generate all output files
      await this.saveResults(metricsReport);
      
      return {
        gameTree: this.gameTree,
        stateHistory: this.stateHistory,
        metrics: metricsReport
      };
      
    } catch (error) {
      console.error('Chyba při průzkumu hry:', error);
      this.metrics.analyzeState('', [], 0, 'error', [], true);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async exploreState(page, depth = 0, parentPath = []) {
    try {
      // Prevent infinite recursion and runaway exploration
      if (depth > this.maxDepth) {
        console.log(`⚠️  Dosažena maximální hloubka ${this.maxDepth}`);
        return;
      }
      
      if (this.visitedStates.size > this.maxStates) {
        console.log(`⚠️  Dosažen maximální počet stavů ${this.maxStates}`);
        return;
      }
      
      // Extract content and choices
      const content = await this.extractContent(page);
      const choices = await this.findChoices(page);
      const stateHash = this.createStateHash(content);
      
      console.log(`🎯 Stav na hloubce ${depth}: ${choices.length} voleb`);
      
      // Analyze state for metrics
      this.metrics.analyzeState(content, choices, depth, stateHash, parentPath);
      
      // Check if we've been here before
      if (this.visitedStates.has(stateHash)) {
        console.log(`🔄 Navštívený stav nalezen na hloubce ${depth}`);
        this.metrics.gameMetrics.loops++;
        return;
      }
      
      this.visitedStates.add(stateHash);
      
      // Store state in game tree
      this.gameTree[stateHash] = {
        content: content.substring(0, 500), // Truncate for storage
        choices: choices.map(choice => choice.text),
        depth: depth,
        timestamp: new Date().toISOString(),
        path: [...parentPath, stateHash]
      };
      
      // Store in history
      this.stateHistory.push({
        hash: stateHash,
        depth: depth,
        choiceCount: choices.length,
        content: content.substring(0, 200)
      });
      
      // If no choices, this is an end state
      if (choices.length === 0) {
        console.log(`🏁 Konec cesty na hloubce ${depth}`);
        this.metrics.trackPath([...parentPath, stateHash], depth);
        return;
      }
      
      // Explore each choice
      for (let i = 0; i < choices.length; i++) {
        const choice = choices[i];
        console.log(`🎮 Volba ${i + 1}/${choices.length}: "${choice.text.substring(0, 50)}..."`);
        
        try {
          // Click the choice
          await this.clickChoice(page, choice);
          
          // Wait for state change
          await this.waitForStateChange(page);
          
          // Recursively explore new state
          await this.exploreState(page, depth + 1, [...parentPath, stateHash]);
          
          // Go back to previous state
          await this.goBack(page);
          
        } catch (error) {
          console.error(`❌ Chyba při prozkoumávání volby "${choice.text}":`, error.message);
          this.metrics.analyzeState('', [], depth + 1, 'error', [...parentPath, stateHash], true);
          
          // Try to recover by going back
          try {
            await this.goBack(page);
          } catch (backError) {
            console.error('❌ Nelze se vrátit zpět, ukončuji průzkum této větve');
            break;
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Chyba při analýze stavu na hloubce ${depth}:`, error.message);
      this.metrics.analyzeState('', [], depth, 'error', parentPath, true);
    }
  }

  async extractContent(page) {
    try {
      const content = await page.evaluate(() => {
        // Multiple selectors for different game frameworks
        const selectors = [
          '.story-text', '.game-text', '.content', '.main-text',
          '[class*="story"]', '[class*="text"]', '[class*="content"]',
          'main p', 'article p', '.container p', 'div p',
          '#game-content', '#story', '#text', '.narrative'
        ];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            return Array.from(elements).map(el => el.textContent.trim()).join(' ');
          }
        }
        
        // Fallback: get all text content, excluding script and style tags
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: function(node) {
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              
              const tagName = parent.tagName.toLowerCase();
              if (['script', 'style', 'noscript'].includes(tagName)) {
                return NodeFilter.FILTER_REJECT;
              }
              
              return node.textContent.trim().length > 10 ? 
                NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
          }
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
          textNodes.push(node.textContent.trim());
        }
        
        return textNodes.join(' ');
      });
      
      return content || '';
    } catch (error) {
      console.error('Chyba při extrakci obsahu:', error);
      return '';
    }
  }

  async findChoices(page) {
    try {
      const choices = await page.evaluate(() => {
        const selectors = [
          'button', '.option', '[role="button"]', 'a[href*="#"]', 'a[onclick]',
          '.choice', '.button', '[class*="option"]', '[class*="choice"]',
          '[class*="button"]', 'input[type="button"]', 'input[type="submit"]',
          '.game-choice', '.story-choice', '.narrative-choice'
        ];
        
        const found = [];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.textContent.trim();
            if (text && text.length > 0 && text.length < 200) {
              found.push({
                text: text,
                selector: selector,
                tagName: element.tagName,
                className: element.className,
                id: element.id
              });
            }
          }
          
          if (found.length > 0) break; // Use first successful selector
        }
        
        return found;
      });
      
      return choices || [];
    } catch (error) {
      console.error('Chyba při hledání voleb:', error);
      return [];
    }
  }

  async clickChoice(page, choice) {
    try {
      // Try multiple click strategies
      const clicked = await page.evaluate((choiceData) => {
        const elements = document.querySelectorAll(choiceData.selector);
        
        for (const element of elements) {
          if (element.textContent.trim() === choiceData.text) {
            // Try different click methods
            if (element.click) {
              element.click();
              return true;
            }
            
            if (element.onclick) {
              element.onclick();
              return true;
            }
            
            // Dispatch click event
            element.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            }));
            return true;
          }
        }
        
        return false;
      }, choice);
      
      if (!clicked) {
        throw new Error(`Nelze kliknout na volbu: ${choice.text}`);
      }
      
    } catch (error) {
      console.error('Chyba při klikání:', error);
      throw error;
    }
  }

  async waitForStateChange(page) {
    try {
      // Wait for potential page changes
      await page.waitForTimeout(1000);
      
      // Check if URL changed (indicating navigation)
      const url = page.url();
      if (url !== page.url()) {
        await page.waitForLoadState('domcontentloaded');
      }
      
    } catch (error) {
      // Non-critical error, continue
      console.log('Timeout při čekání na změnu stavu');
    }
  }

  async goBack(page) {
    try {
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 5000 });
      await page.waitForTimeout(500);
    } catch (error) {
      // If back doesn't work, try refresh or reload
      console.log('Nelze jít zpět, zkouším obnovení...');
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
  }

  createStateHash(content) {
    return crypto.createHash('md5')
      .update(content.replace(/\s+/g, ' ').trim().toLowerCase())
      .digest('hex');
  }

  async saveResults(metricsReport) {
    try {
      // Save game tree
      await fs.writeFile(
        'game_exploration_results.json', 
        JSON.stringify({
          gameTree: this.gameTree,
          stateHistory: this.stateHistory,
          summary: {
            totalStates: this.visitedStates.size,
            explorationDate: new Date().toISOString(),
            version: '2.0.0'
          }
        }, null, 2)
      );
      
      // Save metrics
      await fs.writeFile('game_metrics.json', JSON.stringify(metricsReport, null, 2));
      
      // Save human-readable reports
      await fs.writeFile('game_exploration_report.txt', this.generateExplorationReport());
      await fs.writeFile('game_metrics_summary.txt', this.generateMetricsSummary(metricsReport));
      
      console.log('✅ Všechny soubory uloženy');
    } catch (error) {
      console.error('❌ Chyba při ukládání souborů:', error);
    }
  }

  generateExplorationReport() {
    const timestamp = new Date().toLocaleString('cs-CZ');
    
    return `
PRŮZKUM TEXTOVÉ HRY - ZÁVĚREČNÁ ZPRÁVA
======================================
Datum: ${timestamp}
Verze nástroje: 2.0.0

ZÁKLADNÍ STATISTIKY:
• Celkem prozkoumáno stavů: ${this.visitedStates.size}
• Celkem v herním stromu: ${Object.keys(this.gameTree).length}
• Maximální dosažená hloubka: ${this.metrics.gameMetrics.maxDepth}

PROZKOUMANÉ STAVY:
${this.stateHistory.slice(0, 10).map((state, i) => 
  `${i + 1}. Hloubka ${state.depth}, ${state.choiceCount} voleb: "${state.content.substring(0, 80)}..."`
).join('\n')}

${this.stateHistory.length > 10 ? `... a dalších ${this.stateHistory.length - 10} stavů` : ''}

STRUKTURA HERNÍHO STROMU:
${Object.entries(this.gameTree).slice(0, 5).map(([hash, data]) => 
  `• ${hash.substring(0, 8)}: ${data.choices.length} voleb na hloubce ${data.depth}`
).join('\n')}

Kompletní data najdete v game_exploration_results.json
    `;
  }

  generateMetricsSummary(report) {
    return `
ANALÝZA TEXTOVÉ HRY - METRIKY
====================================
Datum: ${new Date().toLocaleString('cs-CZ')}

ZÁKLADNÍ STATISTIKY:
• Celkem stavů: ${report.summary.totalStates}
• Celkem cest: ${report.summary.totalPaths}
• Úplnost průzkumu: ${report.summary.explorationCompleteness}
• Průměrná hloubka: ${report.summary.avgDepth}
• Maximální hloubka: ${report.summary.maxDepth}
• Chybové stavy: ${report.summary.errorStates}

STRUKTURA HRY:
• Větvení: ${report.structure.branchingFactor.min}-${report.structure.branchingFactor.max} (průměr: ${report.structure.branchingFactor.avg})
• Slepé uličky: ${report.structure.deadEnds}
• Lineární cesty: ${report.structure.linearPaths}
• Smyčky: ${report.structure.loops}
• Distribuce voleb: ${JSON.stringify(report.structure.branchingFactor.distribution)}

OBSAH:
• Průměr slov na stav: ${report.content.avgWordsPerState}
• Rozsah textu: ${report.content.textRange}
• Duplicitní stavy: ${report.content.duplicateStates}
• Celkem slov: ${report.content.totalWords}

VÝKON:
• Celkový čas: ${report.performance.totalTime}
• Průměr na stav: ${report.performance.avgTimePerState}
• Efektivita průzkumu: ${report.performance.explorationEfficiency}

HODNOCENÍ KVALITY:
• Vyváženost hry: ${report.quality.gameBalance}
• Rozmanitost obsahu: ${report.quality.contentVariety}
• Plynulost navigace: ${report.quality.navigationFlow}
• Celkové skóre: ${report.quality.overallScore}/100

POKROČILÁ ANALÝZA:
• Distribuce délky cest: ${JSON.stringify(report.detailedAnalysis.pathDistribution)}
• Distribuce hloubek: ${JSON.stringify(report.detailedAnalysis.depthAnalysis)}

DOPORUČENÍ:
${this.generateRecommendations(report)}
    `;
  }

  generateRecommendations(report) {
    const recommendations = [];
    
    if (report.structure.deadEnds > report.summary.totalStates * 0.3) {
      recommendations.push("• Snižte počet slepých uliček (>30% je příliš mnoho)");
    }
    
    if (parseFloat(report.structure.branchingFactor.avg) < 1.5) {
      recommendations.push("• Přidejte více voleb - hra je příliš lineární");
    }
    
    if (report.content.duplicateStates > 0) {
      recommendations.push(`• Bylo nalezeno ${report.content.duplicateStates} duplicitních stavů`);
    }
    
    if (parseFloat(report.content.avgWordsPerState) < 30) {
      recommendations.push("• Zvažte rozšíření textového obsahu - průměr je nízký");
    }
    
    if (report.summary.errorStates > 0) {
      recommendations.push(`• Opravte ${report.summary.errorStates} chybových stavů`);
    }
    
    if (report.quality.overallScore < 70) {
      recommendations.push("• Celkové skóre je nízké, zaměřte se na zlepšení struktury hry");
    }
    
    return recommendations.length > 0 ? recommendations.join('\n') : "• Hra vypadá dobře strukturovaná!";
  }
}

module.exports = GameExplorer;