const GameExplorer = require('./game-explorer.js');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log('🎮 AUTOMATICKÝ PRŮZKUMNÍK TEXTOVÉ HRY');
    console.log('=====================================\n');
    
    // Zeptá se na URL hry
    const gameUrl = await new Promise((resolve) => {
        rl.question('🔗 Zadejte URL vaší textové hry: ', (answer) => {
            resolve(answer);
        });
    });

    console.log('\n⚙️ NASTAVENÍ:');
    console.log('📌 Program bude systematicky klikat na všechny možnosti');
    console.log('📌 Výsledky se uloží do souborů game_exploration_*.json a *.txt');
    console.log('📌 Prohlížeč zůstane otevřený pro sledování postupu');
    
    const confirm = await new Promise((resolve) => {
        rl.question('\n✅ Chcete pokračovat? (y/n): ', (answer) => {
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });

    if (!confirm) {
        console.log('❌ Průzkum zrušen');
        rl.close();
        return;
    }

    rl.close();

    const explorer = new GameExplorer();
    
    try {
        console.log('\n🚀 Spouštím průzkum...');
        
        const results = await explorer.exploreGame(gameUrl);
        
        console.log('\n🎉 Průzkum úspěšně dokončen!');
        console.log('📁 Zkontrolujte soubory:');
        console.log('   📄 game_exploration_results.json - Detailní data');
        console.log('   📄 game_exploration_report.txt - Čitelný report');
        console.log('   📄 game_metrics.json - Pokročilé metriky');
        console.log('   📄 game_metrics_summary.txt - Přehled metrik');
        
        console.log('\n📊 RYCHLÝ PŘEHLED:');
        console.log(`   🎯 Celkem stavů: ${results.metrics.summary.totalStates}`);
        console.log(`   🌳 Celkem cest: ${results.metrics.summary.totalPaths}`);
        console.log(`   📏 Max hloubka: ${results.metrics.summary.maxDepth}`);
        console.log(`   🎲 Skóre kvality: ${results.metrics.quality.overallScore}/100`);
        
    } catch (error) {
        console.error('\n❌ Nastala chyba při průzkumu:', error.message);
        console.error('💡 Možná řešení:');
        console.error('   - Zkontrolujte URL adresu');
        console.error('   - Upravte selektory v kódu podle struktury vaší hry');
        console.error('   - Zkontrolujte internetové připojení');
    }
    
    console.log('\n👋 Program ukončen');
}

main().catch(console.error);