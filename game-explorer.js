const puppeteer = require('puppeteer');
const fs = require('fs');

class GameExplorer {
    constructor() {
        this.visitedStates = new Map(); // Mapa navštívených stavů
        this.gameTree = {}; // Strom možností hry
        this.currentPath = []; // Aktuální cesta
        this.choiceHistory = new Map(); // Mapa provedených voleb pro každý stav
        this.stateChoiceMap = new Map(); // Mapuje stav na provedené volby
        this.browser = null;
        this.page = null;
    }

    async init(gameUrl) {
        this.browser = await puppeteer.launch({ 
            headless: false, // Zobrazí prohlížeč pro sledování
            defaultViewport: { width: 1200, height: 800 }
        });
        this.page = await this.browser.newPage();
        await this.page.goto(gameUrl);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Počká na načtení
    }

    // Získá text aktuální scény a možnosti
    async getCurrentState() {
        try {
            const stateData = await this.page.evaluate(() => {
                // Funkce pro získání unikátního obsahu stránky
                function getUniquePageContent() {
                    // Získá všechny textové uzly
                    const walker = document.createTreeWalker(
                        document.body,
                        NodeFilter.SHOW_TEXT,
                        null,
                        false
                    );
                    
                    let textContent = '';
                    let node;
                    while (node = walker.nextNode()) {
                        const text = node.textContent.trim();
                        if (text.length > 0) {
                            textContent += text + ' ';
                        }
                    }
                    return textContent.trim();
                }
                // Najde hlavní text hry (více selektorů pro lepší kompatibilitu)
                const storySelectors = [
                    '.story-text', '.game-text', '.content', '.main-text', 
                    '[class*="story"]', '[class*="text"]', '[class*="content"]',
                    'main p', 'article p', '.container p', 'div p'
                ];
                
                let storyText = '';
                for (const selector of storySelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.innerText.trim()) {
                        storyText = element.innerText.trim();
                        break;
                    }
                }
                
                if (!storyText) {
                    // Fallback: vezme první neprázdný text element
                    const allP = document.querySelectorAll('p, div, span');
                    for (const el of allP) {
                        const text = el.innerText?.trim();
                        if (text && text.length > 20) {
                            storyText = text;
                            break;
                        }
                    }
                }
                
                // Pokusí se získat více textu ze stránky pro lepší identifikaci
                if (storyText.length < 100) {
                    const uniqueContent = getUniquePageContent();
                    if (uniqueContent.length > storyText.length) {
                        storyText = uniqueContent.substring(0, 800); // Vezme kompletní obsah
                    }
                }
                
                // Najde všechny možnosti (rozšířené selektory)
                const options = [];
                const buttonSelectors = [
                    'button', '.option', '[role="button"]', 
                    'a[href*="#"]', 'a[onclick]', '.choice', '.button',
                    '[class*="option"]', '[class*="choice"]', '[class*="button"]',
                    'input[type="button"]', 'input[type="submit"]'
                ];
                
                const allButtons = [];
                buttonSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => allButtons.push(el));
                });
                
                // Odstraní duplicity
                const uniqueButtons = [...new Set(allButtons)];
                
                uniqueButtons.forEach((btn, index) => {
                    const text = btn.innerText?.trim() || btn.value?.trim() || btn.getAttribute('aria-label')?.trim() || '';
                    if (text && 
                        !text.includes('🤔 Co uděláte?') && 
                        !text.includes('Menu') &&
                        !text.includes('Home') &&
                        text.length > 0 &&
                        text.length < 200) {
                        options.push({
                            index: index,
                            text: text,
                            element: btn.tagName + (btn.className ? '.' + btn.className.split(' ')[0] : ''),
                            visible: btn.offsetParent !== null
                        });
                    }
                });
    
                return {
                    storyText: storyText.substring(0, 600), // Více textu pro lepší rozlišení stavů
                    options: options.filter(opt => opt.visible),
                    url: window.location.href,
                    timestamp: Date.now(),
                    fullContent: getUniquePageContent() // Uložit celý obsah pro porovnání
                };
            });
    
            console.log(`🔍 Nalezen stav: "${stateData.storyText.substring(0, 80)}..."`);
            console.log(`⚡ Možnosti (${stateData.options.length}): ${stateData.options.map(o => `"${o.text}"`).join(', ')}`);
            
            return stateData;
        } catch (error) {
            console.error('❌ Chyba při získávání stavu:', error);
            return {
                storyText: 'ERROR: Could not get state',
                options: [],
                url: this.page.url(),
                timestamp: Date.now()
            };
        }
    }

    // Vytvoří hash pro identifikaci stavu
    createStateHash(stateData) {
        // Použije kompletní obsah stránky pro lepší rozlišení stavů
        const fullText = (stateData.fullContent || stateData.storyText).replace(/\s+/g, ' ').trim().toLowerCase();
        
        // Vytvoří detailnější hash včetně specifických částí obsahu
        const optionsText = stateData.options
            .map(o => o.text.replace(/\s+/g, ' ').trim().toLowerCase())
            .join('|||'); // Neřadí možnosti, zachovává pořadí
        
        // Přidá cestu jako další rozlišovač
        const pathContext = this.currentPath.join('>>');
        
        // Vytvoří hash z kombinace cesty, textu a možností
        const hashInput = `PATH:${pathContext}***FULLTEXT:${fullText}***OPTIONS:${optionsText}`;
        const hash = Buffer.from(hashInput).toString('base64').substring(0, 32);
        
        console.log(`🔑 Hash pro stav: ${hash}`);
        console.log(`📄 Cesta: ${pathContext}`);
        console.log(`📄 Text ukázka: ${fullText.substring(0, 50)}...`);
        return hash;
    }

    // Klikne na možnost
    async clickOption(optionIndex) {
        try {
            const success = await this.page.evaluate((index) => {
                const buttonSelectors = [
                    'button', '.option', '[role="button"]', 
                    'a[href*="#"]', 'a[onclick]', '.choice', '.button',
                    '[class*="option"]', '[class*="choice"]', '[class*="button"]',
                    'input[type="button"]', 'input[type="submit"]'
                ];
                
                const allButtons = [];
                buttonSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => allButtons.push(el));
                });
                
                const uniqueButtons = [...new Set(allButtons)].filter(btn => {
                    const text = btn.innerText?.trim() || btn.value?.trim() || '';
                    return text.length > 0 && btn.offsetParent !== null;
                });
                
                if (uniqueButtons[index]) {
                    const button = uniqueButtons[index];
                    console.log('Clicking button:', button.innerText || button.value);
                    
                    // Zkusí různé způsoby kliknutí
                    if (button.click) {
                        button.click();
                        return true;
                    } else if (button.onclick) {
                        button.onclick();
                        return true;
                    } else if (button.href) {
                        window.location.href = button.href;
                        return true;
                    }
                }
                return false;
            }, optionIndex);
            
            if (!success) {
                console.warn(`⚠️ Nepodařilo se kliknout na možnost ${optionIndex}`);
                return false;
            }
            
            // Počká na změnu stránky nebo obsahu
            await Promise.race([
                this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => null),
                new Promise(resolve => setTimeout(resolve, 2000))
            ]);
            
            return true;
        } catch (error) {
            console.error(`❌ Chyba při klikání na možnost ${optionIndex}:`, error.message);
            return false;
        }
    }

    // Hlavní průzkumná metoda
    async explore() {
        console.log('🎮 Začínám průzkum hry...');
        await this.exploreRecursively();
        await this.saveResults();
    }

    async exploreRecursively(depth = 0) {
        if (depth > 25) { // Zvýšená maximální hloubka
            console.log('⚠️ Dosažena maximální hloubka průzkumu');
            return;
        }

        console.log(`\n📍 === HLOUBKA ${depth} ===`);
        console.log(`🛤️ Aktuální cesta: ${this.currentPath.join(' → ')}`);
        
        const currentState = await this.getCurrentState();
        if (!currentState || !currentState.storyText) {
            console.error('❌ Nelze získat stav stránky');
            return;
        }
        
        const stateHash = this.createStateHash(currentState);
        
        console.log(`📖 Příběh: ${currentState.storyText.substring(0, 100)}...`);
        console.log(`🎯 Možnosti (${currentState.options.length}): ${currentState.options.map(o => `"${o.text}"`).join(', ')}`);

        // Zkontroluje, jestli už byl tento stav navštíven
        if (this.visitedStates.has(stateHash)) {
            const previousVisit = this.visitedStates.get(stateHash);
            console.log('✅ Stav již navštíven, vracím se...');
            console.log(`📊 Celkem navštíveno: ${this.visitedStates.size} stavů`);
            console.log(`🕐 Předchozí návštěva: ${previousVisit.path.join(' → ')}`);
            return;
        }

        // Označí stav jako navštívený
        this.visitedStates.set(stateHash, {
            ...currentState,
            path: [...this.currentPath],
            timestamp: new Date().toISOString()
        });

        // Uloží do stromu hry
        this.gameTree[stateHash] = {
            text: currentState.storyText,
            options: currentState.options.map(o => ({ 
                text: o.text, 
                explored: false,
                chosen: false,
                chosenAt: null
            })),
            children: {}
        };

        // Inicializuje mapu voleb pro tento stav
        if (!this.stateChoiceMap.has(stateHash)) {
            this.stateChoiceMap.set(stateHash, new Set());
        }

        // Kontrola, zda má stav nějaké možnosti
        if (currentState.options.length === 0) {
            console.log('🏁 Koncový stav - žádné další možnosti');
            return;
        }

        // Projde všechny možnosti
        for (let i = 0; i < currentState.options.length; i++) {
            const option = currentState.options[i];
            const choiceKey = `${stateHash}:${option.text}`;
            const wasChosen = this.choiceHistory.has(choiceKey);
            
            console.log(`🔄 Zkouším možnost ${i + 1}/${currentState.options.length}: "${option.text}"${wasChosen ? ' [JIŽ VYBRÁNO]' : ' [NOVÉ]'}`);
            
            this.currentPath.push(option.text);
            
            // Uloží aktuální URL pro návrat
            const originalUrl = this.page.url();
            
            try {
                // Klikne na možnost
                const clickSuccess = await this.clickOption(option.index);
                
                if (clickSuccess) {
                    // Zaznačí volbu do historie
                    this.choiceHistory.set(choiceKey, {
                        stateHash: stateHash,
                        optionText: option.text,
                        timestamp: new Date().toISOString(),
                        path: [...this.currentPath]
                    });
                    
                    // Aktualizuje stateChoiceMap
                    this.stateChoiceMap.get(stateHash).add(option.text);
                    
                    // Označí možnost jako vybranou v game tree
                    if (this.gameTree[stateHash] && this.gameTree[stateHash].options[i]) {
                        this.gameTree[stateHash].options[i].chosen = true;
                        this.gameTree[stateHash].options[i].chosenAt = new Date().toISOString();
                    }
                    
                    // Rekurzivně prozkoumá nový stav
                    await this.exploreRecursively(depth + 1);
                    
                    // Pokusí se vrátit zpět
                    try {
                        const currentUrl = this.page.url();
                        if (currentUrl !== originalUrl) {
                            console.log('🔙 Vracím se zpět...');
                            await this.page.goBack();
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            
                            // Zkontroluje, zda se skutečně vrátil
                            const backUrl = this.page.url();
                            if (backUrl !== originalUrl) {
                                console.log('⚠️ Návrat se nezdařil, obnovujem stránku...');
                                await this.page.goto(originalUrl);
                                await new Promise(resolve => setTimeout(resolve, 2000));
                            }
                        }
                    } catch (navError) {
                        console.warn('⚠️ Problém s navigací:', navError.message);
                        // Pokus o obnovení stránky
                        try {
                            await this.page.goto(originalUrl);
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        } catch (reloadError) {
                            console.error('❌ Nelze obnovit stránku:', reloadError.message);
                        }
                    }
                } else {
                    console.warn(`⚠️ Přeskakuji možnost "${option.text}" - kliknutí selhalo`);
                }
            } catch (error) {
                console.error(`❌ Chyba při zpracování možnosti "${option.text}":`, error.message);
            }
            
            this.currentPath.pop();
            
            // Označí možnost jako prozkoumanou
            if (this.gameTree[stateHash] && this.gameTree[stateHash].options[i]) {
                this.gameTree[stateHash].options[i].explored = true;
            }
        }
    }

    // Uloží výsledky do souboru
    async saveResults() {
        const results = {
            totalStates: this.visitedStates.size,
            totalChoices: this.choiceHistory.size,
            gameTree: this.gameTree,
            visitedStates: Object.fromEntries(this.visitedStates),
            choiceHistory: Object.fromEntries(this.choiceHistory),
            stateChoiceMap: Object.fromEntries(
                Array.from(this.stateChoiceMap.entries()).map(([key, value]) => [key, Array.from(value)])
            ),
            timestamp: new Date().toISOString()
        };

        // Uloží jako JSON
        fs.writeFileSync('game_exploration_results.json', JSON.stringify(results, null, 2));
        
        // Vytvoří čitelný report
        let report = `📊 REPORT PRŮZKUMU HRY\n`;
        report += `========================\n\n`;
        report += `🔢 Celkem stavů: ${this.visitedStates.size}\n`;
        report += `🎯 Celkem voleb: ${this.choiceHistory.size}\n`;
        report += `📅 Dokončeno: ${new Date().toLocaleString('cs-CZ')}\n\n`;
        
        report += `📝 NAVŠTÍVENÉ STAVY:\n`;
        report += `===================\n`;
        
        for (const [hash, state] of this.visitedStates) {
            const chosenOptions = this.stateChoiceMap.get(hash) || new Set();
            report += `\n🎯 Stav: ${hash}\n`;
            report += `📖 Text: ${state.storyText.substring(0, 100)}...\n`;
            report += `🛤️ Cesta: ${state.path.join(' → ')}\n`;
            report += `⚡ Možnosti: ${state.options.map(o => {
                const wasChosen = chosenOptions.has(o.text);
                return `${o.text}${wasChosen ? ' ✅' : ' ⭕'}`;
            }).join(', ')}\n`;
            report += `─────────────────────────────────\n`;
        }
        
        report += `\n📋 HISTORIE VOLEB:\n`;
        report += `==================\n`;
        
        for (const [choiceKey, choiceData] of this.choiceHistory) {
            report += `\n🎯 Volba: ${choiceData.optionText}\n`;
            report += `📍 Stav: ${choiceData.stateHash}\n`;
            report += `🕐 Čas: ${new Date(choiceData.timestamp).toLocaleString('cs-CZ')}\n`;
            report += `🛤️ Cesta: ${choiceData.path.join(' → ')}\n`;
            report += `─────────────────────────────────\n`;
        }

        fs.writeFileSync('game_exploration_report.txt', report);
        
        console.log('💾 Výsledky uloženy do:');
        console.log('   📄 game_exploration_results.json');
        console.log('   📄 game_exploration_report.txt');
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Použití:
async function main() {
    const explorer = new GameExplorer();
    
    try {
        // Nahraďte URL adresou vaší hry
        await explorer.init('https://vase-hra.cz'); 
        
        await explorer.explore();
        
        console.log('🎉 Průzkum dokončen!');
        
    } catch (error) {
        console.error('❌ Chyba:', error);
    } finally {
        await explorer.close();
    }
}

// Spustí průzkum
// main();

module.exports = GameExplorer;