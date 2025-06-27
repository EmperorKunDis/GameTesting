# 🎮 Game Testing Tool 2.0

Pokročilý nástroj pro automatizované testování textových adventur s detailními metrikami a analýzou kvality.

## ✨ Nové funkce v 2.0

- **📊 Pokročilé metriky**: Kompletní analýza struktury hry, vyváženosti a obsahu
- **🎯 Kvalitativní hodnocení**: Automatické skóre kvality hry (0-100 bodů)
- **📈 Detailní reporty**: Lidsky čitelné zprávy v češtině s doporučeními
- **🔍 Duplikátní obsah**: Detekce opakujícího se obsahu
- **⚡ Optimalizovaný výkon**: Rychlejší průzkum s blokováním nepotřebných zdrojů
- **🛡️ Robustní error handling**: Lepší zpracování chyb a obnova
- **📋 Testovací sada**: Automatizované testy pro validaci funkčnosti

## 📦 Instalace

```bash
# Klonování repositáře
git clone https://github.com/EmperorKunDis/GameTesting.git
cd GameTesting

# Instalace závislostí
npm install

# Spuštění
npm start
```

## 🚀 Rychlé použití

### Základní průzkum
```bash
npm start
# Zadejte URL vaší hry: https://emperorkundis.github.io/physics-adventure-game/
```

### Testování
```bash
# Základní test
npm test

# Pokročilé testování
node test-example.js --advanced

# Výkonnostní benchmark
node test-example.js --benchmark
```

## 📁 Struktura výstupních souborů

Po dokončení průzkumu nástroj vygeneruje:

### 📊 Metriky a analýza
- **`game_metrics.json`** - Strukturovaná data metrik
- **`game_metrics_summary.txt`** - Přehledný souhrn v češtině s doporučeními

### 🗺️ Herní mapa
- **`game_exploration_results.json`** - Kompletní herní strom s historií
- **`game_exploration_report.txt`** - Lidsky čitelný report průzkumu

## 📊 Analyzované metriky

### 🏗️ Struktura hry
- **Celkové stavy**: Počet unikátních herních situací
- **Větvení**: Min/max/průměr počtu voleb na stav
- **Hloubka**: Maximální a průměrná délka herních cest
- **Slepé uličky**: Stavy bez dalších možností
- **Smyčky**: Detekce cyklických cest

### 📝 Kvalita obsahu
- **Délka textů**: Statistiky délky textového obsahu
- **Rozmanitost**: Variabilita textu mezi stavy
- **Duplikáty**: Opakující se obsahy
- **Slovní zásoба**: Celkový počet slov

### ⚡ Výkon
- **Rychlost průzkumu**: Stavy za sekundu
- **Celkový čas**: Doba potřebná k analýze
- **Efektivita**: Poměr analyzovaných stavů k času

### 🎯 Kvalitativní hodnocení (0-100 bodů)
- **Vyváženost hry**: Hodnotí distribuci voleb a slepých uliček
- **Rozmanitost obsahu**: Posuzuje variabilitu textu
- **Plynulost navigace**: Analyzuje tok rozhodování

## 🔧 Konfigurace

### Přizpůsobení pro vaši hru

V `game-explorer.js` můžete upravit:

```javascript
// Selektory pro obsah
const contentSelectors = [
  '.story-text',     // Váš specifický selektor
  '.game-content',   // Další možnost
  '#narrative'       // ID element
];

// Selektory pro volby
const choiceSelectors = [
  '.game-choice',    // Tlačítka voleb
  '.option-button',  // Odkazy voleb
  'button.choice'    // Specifické tlačítka
];
```

### Limity průzkumu
```javascript
this.maxDepth = 50;     // Maximální hloubka
this.maxStates = 1000;  // Maximální počet stavů
this.timeoutMs = 30000; // Timeout na stránku (ms)
```

## 📈 Interpretace výsledků

### Doporučené hodnoty

| Metrika | Ideální rozsah | Varování |
|---------|----------------|----------|
| Větvení (průměr) | 2.0 - 3.5 | < 1.5 (příliš lineární), > 4.0 (příliš složité) |
| Slepé uličky | < 20% stavů | > 30% stavů |
| Duplicitní obsah | 0% | > 20% |
| Celkové skóre | 80-100 | < 70 |

### Příklad interpretace
```
✅ DOBRÉ SKÓRE (85/100):
• Vyváženost hry: Vyvážená (2.3 volby/stav)
• Obsah: Dobrá rozmanitost (5-150 slov/stav)
• Navigace: Vyvážená (25% lineárních cest)

⚠️  UPOZORNĚNÍ:
• 3 duplicitní stavy nalezeny
• Zvažte zkrácení nejdelších textů
```

## 🛠️ Pokročilé funkce

### Vlastní selektory
```javascript
// Pro hry s nestandartní strukturou
const customSelectors = {
  story: '.my-game-text',
  choices: '.my-choice-buttons'
};
```

### Batch testování
```javascript
const urls = [
  'https://hra1.example.com',
  'https://hra2.example.com'
];

for (const url of urls) {
  await explorer.exploreGame(url);
}
```

## 🐛 Řešení problémů

### Časté chyby

**❌ "Nelze najít volby"**
- Zkontrolujte selektory v kódu
- Hra může používat nestandardní elementy

**❌ "Timeout při načítání"**
- Zvyšte `timeoutMs` hodnotu
- Zkontrolujte internetové připojení

**❌ "Příliš mnoho stavů"**
- Snižte `maxStates` pro prevenci nekonečných smyček
- Zkontrolujte, zda hra nemá dynamický obsah

### Debug režim
```bash
# Spuštění s debugováním
node --inspect index.js

# Podrobný výstup
DEBUG=true npm start
```

## 📚 API Reference

### GameExplorer
```javascript
const explorer = new GameExplorer();

// Hlavní metoda
const results = await explorer.exploreGame(url);

// Výsledky obsahují
{
  gameTree: {},      // Mapa všech stavů
  stateHistory: [],  // Historie průzkumu
  metrics: {}        // Kompletní metriky
}
```

### GameMetrics
```javascript
const metrics = new GameMetrics();

// Analýza stavu
metrics.analyzeState(content, choices, depth, hash);

// Finální report
const report = metrics.generateReport();
```

## 🎯 Příklady použití

### Pro vývojáře her
```javascript
// Testování balance
if (metrics.structure.deadEnds > totalStates * 0.3) {
  console.log('⚠️ Příliš mnoho slepých uliček!');
}

// Kontrola obsahu
if (metrics.content.avgWordsPerState < 50) {
  console.log('💬 Zvažte delší popisy');
}
```

### Pro QA testery
```bash
# Automatické testování před release
npm test
node test-example.js --advanced

# Ověření výkonu
node test-example.js --benchmark
```

## 🤝 Přispívání

1. Fork repositáře
2. Vytvořte feature branch (`git checkout -b nova-funkce`)
3. Commit změny (`git commit -am 'Přidána nová funkce'`)
4. Push do branch (`git push origin nova-funkce`)
5. Vytvořte Pull Request

## 📝 Changelog

### v2.0.0 (2025-06-27)
- ✨ Přidány pokročilé metriky
- 🎯 Kvalitativní hodnocení hry
- 📊 Detailní reporty v češtině
- 🛡️ Robustní error handling
- ⚡ Optimalizace výkonu
- 🧪 Testovací sada

### v1.0.0
- 🎮 Základní průzkum textových her
- 🗺️ Mapování herního stromu
- 📁 JSON a TXT reporty

## 📄 Licence

MIT License - viz [LICENSE](LICENSE) soubor.

## 🙋‍♂️ Podpora

- 🐛 **Issues**: [GitHub Issues](https://github.com/EmperorKunDis/GameTesting/issues)
- 💬 **Diskuze**: [GitHub Discussions](https://github.com/EmperorKunDis/GameTesting/discussions)
- 📧 **Email**: [vaš-email@example.com]

---

**Vytvořeno s ❤️ pro komunitu vývojářů textových her**