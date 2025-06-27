const GameExplorer = require('./game-explorer');

// Test example for automated testing
async function runTestExample() {
  console.log('🧪 TESTOVACÍ PŘÍKLAD');
  console.log('====================');
  
  const explorer = new GameExplorer();
  
  // Test with your physics adventure game
  const testUrl = 'https://emperorkundis.github.io/physics-adventure-game/';
  
  console.log(`🎯 Testování hry: ${testUrl}`);
  console.log('📊 Spouštím automatický test...\n');
  
  try {
    const startTime = Date.now();
    const results = await explorer.exploreGame(testUrl);
    const endTime = Date.now();
    
    console.log('\n✅ TEST DOKONČEN!');
    console.log('================');
    
    // Display key metrics
    console.log('\n📈 KLÍČOVÉ METRIKY:');
    console.log(`• Stavů: ${results.metrics.summary.totalStates}`);
    console.log(`• Cest: ${results.metrics.summary.totalPaths}`);
    console.log(`• Max hloubka: ${results.metrics.summary.maxDepth}`);
    console.log(`• Větvení: ${results.metrics.structure.branchingFactor.avg}`);
    console.log(`• Slepé uličky: ${results.metrics.structure.deadEnds}`);
    console.log(`• Celkové skóre: ${results.metrics.quality.overallScore}/100`);
    
    // Test assertions
    console.log('\n🔍 VALIDACE VÝSLEDKŮ:');
    
    // Basic validation
    if (results.metrics.summary.totalStates > 0) {
      console.log('✅ Stavy byly nalezeny');
    } else {
      console.log('❌ Žádné stavy nebyly nalezeny');
    }
    
    if (results.metrics.summary.maxDepth > 0) {
      console.log('✅ Hra má nějakou hloubku');
    } else {
      console.log('❌ Hra nemá žádnou hloubku');
    }
    
    if (results.metrics.structure.branchingFactor.avg > 0) {
      console.log('✅ Nalezeny volby pro hráče');
    } else {
      console.log('❌ Nenalezeny žádné volby');
    }
    
    // Performance validation
    const totalTimeSeconds = (endTime - startTime) / 1000;
    if (totalTimeSeconds < 300) { // 5 minutes
      console.log('✅ Test dokončen v rozumném čase');
    } else {
      console.log('⚠️  Test trval dlouho (>5 min)');
    }
    
    // Quality checks
    if (results.metrics.quality.overallScore >= 70) {
      console.log('✅ Hra má dobré celkové skóre');
    } else {
      console.log('⚠️  Hra má nízké celkové skóre');
    }
    
    console.log('\n📁 VYGENEROVANÉ SOUBORY:');
    console.log('• game_exploration_results.json');
    console.log('• game_exploration_report.txt');
    console.log('• game_metrics.json');
    console.log('• game_metrics_summary.txt');
    
    return results;
    
  } catch (error) {
    console.error('\n❌ TEST SELHAL:');
    console.error(error.message);
    
    console.log('\n🔧 MOŽNÉ ŘEŠENÍ:');
    console.log('• Zkontrolujte internetové připojení');
    console.log('• Ověřte, že URL je dostupná');
    console.log('• Zkuste spustit test později');
    
    return null;
  }
}

// Advanced test with multiple scenarios
async function runAdvancedTest() {
  console.log('\n🚀 POKROČILÝ TEST');
  console.log('=================');
  
  const testScenarios = [
    {
      name: 'Hlavní hra',
      url: 'https://emperorkundis.github.io/physics-adventure-game/',
      expectedMinStates: 5,
      expectedMinDepth: 2
    }
    // Add more test scenarios here
  ];
  
  const results = [];
  
  for (const scenario of testScenarios) {
    console.log(`\n🎮 Testování: ${scenario.name}`);
    console.log(`🌐 URL: ${scenario.url}`);
    
    try {
      const explorer = new GameExplorer();
      const result = await explorer.exploreGame(scenario.url);
      
      // Validate expectations
      const passed = 
        result.metrics.summary.totalStates >= scenario.expectedMinStates &&
        result.metrics.summary.maxDepth >= scenario.expectedMinDepth;
      
      results.push({
        scenario: scenario.name,
        passed: passed,
        states: result.metrics.summary.totalStates,
        depth: result.metrics.summary.maxDepth,
        score: result.metrics.quality.overallScore
      });
      
      console.log(passed ? '✅ PROŠEL' : '❌ NEPROŠEL');
      
    } catch (error) {
      console.log(`❌ CHYBA: ${error.message}`);
      results.push({
        scenario: scenario.name,
        passed: false,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n📊 SOUHRN TESTŮ:');
  console.log('================');
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.scenario}`);
    if (result.states) {
      console.log(`   Stavů: ${result.states}, Hloubka: ${result.depth}, Skóre: ${result.score}`);
    }
    if (result.error) {
      console.log(`   Chyba: ${result.error}`);
    }
  });
  
  const passedCount = results.filter(r => r.passed).length;
  console.log(`\n📈 Úspěšnost: ${passedCount}/${results.length} (${((passedCount/results.length)*100).toFixed(1)}%)`);
  
  return results;
}

// Performance benchmark
async function runPerformanceBenchmark() {
  console.log('\n⚡ VÝKONNOSTNÍ BENCHMARK');
  console.log('========================');
  
  const url = 'https://emperorkundis.github.io/physics-adventure-game/';
  const runs = 3;
  const times = [];
  
  for (let i = 0; i < runs; i++) {
    console.log(`\n🏃 Běh ${i + 1}/${runs}`);
    
    const startTime = Date.now();
    const explorer = new GameExplorer();
    
    try {
      await explorer.exploreGame(url);
      const endTime = Date.now();
      const duration = endTime - startTime;
      times.push(duration);
      
      console.log(`⏱️  Čas: ${(duration / 1000).toFixed(1)}s`);
      
    } catch (error) {
      console.log(`❌ Chyba v běhu ${i + 1}: ${error.message}`);
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log('\n📊 VÝSLEDKY BENCHMARKU:');
    console.log(`• Průměrný čas: ${(avgTime / 1000).toFixed(1)}s`);
    console.log(`• Nejrychlejší: ${(minTime / 1000).toFixed(1)}s`);
    console.log(`• Nejpomalejší: ${(maxTime / 1000).toFixed(1)}s`);
    console.log(`• Variabilita: ${(((maxTime - minTime) / avgTime) * 100).toFixed(1)}%`);
  }
  
  return times;
}

// Main test runner
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--basic')) {
    await runTestExample();
  } else if (args.includes('--advanced')) {
    await runAdvancedTest();
  } else if (args.includes('--benchmark')) {
    await runPerformanceBenchmark();
  } else {
    console.log('🧪 TESTOVACÍ SADA PRO GAME TESTING TOOL');
    console.log('=======================================');
    console.log('');
    console.log('Dostupné testy:');
    console.log('• node test-example.js --basic      - Základní test');
    console.log('• node test-example.js --advanced   - Pokročilý test');
    console.log('• node test-example.js --benchmark  - Výkonnostní test');
    console.log('');
    console.log('Spouštím základní test...');
    
    await runTestExample();
  }
}

if (require.main === module) {
  main().catch(console.error);
}