const readline = require('readline');
const GameExplorer = require('./game-explorer');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function printWelcome() {
  console.log('\n🎮 TESTOVACÍ NÁSTROJ PRO TEXTOVÉ HRY 2.0');
  console.log('=====================================');
  console.log('Pokročilý průzkum s metrikami a analýzou');
  console.log('');
}

function printHelp() {
  console.log('Příklady URL:');
  console.log('• https://emperorkundis.github.io/physics-adventure-game/');
  console.log('• http://localhost:3000/your-game');
  console.log('• file:///path/to/your/game.html');
  console.log('');
}

async function main() {
  printWelcome();
  
  rl.question('📍 Zadejte URL textové hry (nebo "help" pro příklady): ', async (input) => {
    if (input.toLowerCase() === 'help') {
      printHelp();
      rl.close();
      return;
    }
    
    if (!input.trim()) {
      console.log('❌ Chyba: URL nemůže být prázdné');
      rl.close();
      return;
    }
    
    // Validate URL format
    try {
      new URL(input);
    } catch (error) {
      console.log('❌ Chyba: Neplatný formát URL');
      rl.close();
      return;
    }
    
    console.log(`\n🚀 Začínám průzkum hry: ${input}`);
    console.log('⏱️  Toto může chvíli trvat...\n');
    
    const explorer = new GameExplorer();
    
    try {
      const startTime = Date.now();
      const results = await explorer.exploreGame(input);
      const endTime = Date.now();
      
      console.log('\n✅ PRŮZKUM DOKONČEN!');
      console.log('==================');
      console.log(`⏱️  Celkový čas: ${((endTime - startTime) / 1000).toFixed(1)}s`);
      console.log(`📊 Analyzováno stavů: ${results.metrics.summary.totalStates}`);
      console.log(`🛤️  Nalezeno cest: ${results.metrics.summary.totalPaths}`);
      console.log(`📏 Maximální hloubka: ${results.metrics.summary.maxDepth}`);
      console.log(`⚖️  Vyváženost hry: ${results.metrics.quality.gameBalance}`);
      
      console.log('\n📁 VYGENEROVANÉ SOUBORY:');
      console.log('• game_exploration_results.json - Kompletní herní strom');
      console.log('• game_exploration_report.txt - Lidsky čitelné shrnutí');
      console.log('• game_metrics.json - Detailní metriky');
      console.log('• game_metrics_summary.txt - Přehled metrik v češtině');
      
      if (results.metrics.summary.totalStates > 50) {
        console.log('\n💡 TIP: Pro velké hry zvažte použití vizualizačního nástroje');
      }
      
      if (results.metrics.structure.deadEnds > results.metrics.summary.totalStates * 0.3) {
        console.log('\n⚠️  VAROVÁNÍ: Hra má mnoho slepých uliček (>30%)');
      }
      
    } catch (error) {
      console.error('\n❌ CHYBA PŘI PRŮZKUMU:');
      console.error(error.message);
      
      if (error.message.includes('net::ERR_')) {
        console.log('\n💡 Možné řešení:');
        console.log('• Zkontrolujte internetové připojení');
        console.log('• Ověřte, že URL je dostupná');
        console.log('• Pro lokální soubory použijte file:// protokol');
      }
    }
    
    rl.close();
  });
}

if (require.main === module) {
  main().catch(console.error);
}