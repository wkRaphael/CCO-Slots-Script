// ==UserScript==
// @name         CCO Dice to Slots Script
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Replaces dice with a slot machine
// @author       wkRaphael
// @match        https://case-clicker.com/*
// @updateURL    https://raw.githubusercontent.com/wkRaphael/CCO-Slots-Script/refs/heads/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/wkRaphael/CCO-Slots-Script/refs/heads/main/script.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Configuration for the Slot Machine
    const SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '💎', '💰'];
    const SPIN_DURATION = 1200; // ms

    // Target number to symbol and multiplier mapping
    const TARGET_CONFIG = {
        24: { symbol: '🍒', multiplier: '1.22x', weight: 40 },
        38: { symbol: '🍋', multiplier: '1.5x', weight: 30 },
        69: { symbol: '🍇', multiplier: '3x', weight: 15 },
        91: { symbol: '🔔', multiplier: '10.33x', weight: 8 },
        98: { symbol: '💎', multiplier: '46.5x', weight: 5 },
        99: { symbol: '💰', multiplier: '93x', weight: 2 }
    };

    // Weighted random target number selection
    function getRandomTarget() {
        const targets = Object.keys(TARGET_CONFIG);
        const weights = targets.map(t => TARGET_CONFIG[t].weight);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < targets.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return parseInt(targets[i]);
            }
        }
        return parseInt(targets[0]);
    }

    // Styles to inject for the slot machine
    const STYLES = `
        .slots-container {
            background-color: rgb(37, 38, 43);
            border-radius: 8px;
            padding: 20px;
            max-width: 600px;
            margin: auto;
            color: #fff;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            border: 1px solid #373a40;
        }
        .slots-header {
            font-size: 1.5rem;
            margin-bottom: 10px;
            color: #fcc419;
            font-weight: 700;
        }
        .slots-balance {
            font-size: 1.2rem;
            margin-bottom: 15px;
            color: #40c057;
            font-weight: 600;
        }
        .slots-odds-container {
            background: #1a1b1e;
            border: 1px solid #373a40;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .slots-odds-title {
            font-size: 0.9rem;
            color: #909296;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .slots-odds-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        .slots-odd-item {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 8px;
            background: #25262b;
            border-radius: 4px;
            border: 1px solid #373a40;
            font-size: 0.95rem;
        }
        .slots-odd-symbol {
            font-size: 1.5rem;
        }
        .slots-odd-multiplier {
            color: #fcc419;
            font-weight: 600;
        }
        .slots-bet-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 15px;
        }
        .slots-bet-label {
            font-size: 1rem;
            color: #c1c2c5;
            font-weight: 600;
        }
        .slots-bet-input {
            background-color: #1a1b1e;
            border: 1px solid #fcc419;
            color: #fcc419;
            padding: 8px 12px;
            font-size: 1rem;
            border-radius: 4px;
            font-weight: 600;
            width: 120px;
            text-align: center;
        }
        .slots-bet-input:focus {
            outline: none;
            border-color: #ffd43b;
            box-shadow: 0 0 0 2px rgba(252, 196, 25, 0.2);
        }
        .slots-reels {
            display: flex;
            justify-content: space-around;
            background: #1a1b1e;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 2px solid #fcc419;
            box-shadow: 0 0 20px rgba(252, 196, 25, 0.15);
        }
        .slots-reel {
            font-size: 4rem;
            width: 80px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #25262b;
            border-radius: 4px;
            border: 1px solid #373a40;
        }
        .slots-controls {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .slots-status {
            font-size: 1.2rem;
            min-height: 1.5em;
            color: #c1c2c5;
        }
        .slots-win {
            color: #40c057 !important;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(64, 192, 87, 0.4);
        }
        .slots-lose {
            color: #fa5252 !important;
        }
        .slots-btn {
            background: linear-gradient(135deg, #fcc419 0%, #fab005 100%);
            border: none;
            color: #1a1b1e;
            padding: 14px 32px;
            font-size: 1.3rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(252, 196, 25, 0.3);
        }
        .slots-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(252, 196, 25, 0.4);
        }
        .slots-btn:active:not(:disabled) {
            transform: translateY(0);
        }
        .slots-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        /* Animation classes */
        .spinning {
            animation: spin-effect 0.08s infinite, blur-pulse 0.15s infinite;
        }
        .stopping {
            animation: stop-bounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        @keyframes spin-effect {
            0% {
                transform: translateY(0) scale(1) rotateX(0deg);
                filter: blur(0px);
            }
            25% {
                transform: translateY(-8px) scale(1.1) rotateX(15deg);
                filter: blur(3px);
            }
            50% {
                transform: translateY(0) scale(0.95) rotateX(0deg);
                filter: blur(5px);
            }
            75% {
                transform: translateY(8px) scale(1.05) rotateX(-15deg);
                filter: blur(3px);
            }
            100% {
                transform: translateY(0) scale(1) rotateX(0deg);
                filter: blur(0px);
            }
        }
        @keyframes blur-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        @keyframes stop-bounce {
            0% {
                transform: scale(1.3) rotateZ(10deg);
                filter: blur(5px);
            }
            40% {
                transform: scale(0.9) rotateZ(-5deg);
                filter: blur(2px);
            }
            60% {
                transform: scale(1.1) rotateZ(3deg);
                filter: blur(0px);
            }
            80% {
                transform: scale(0.98) rotateZ(-1deg);
            }
            100% {
                transform: scale(1) rotateZ(0deg);
                filter: blur(0px);
            }
        }
    `;

    // Function to generate the HTML structure
    function createSlotMachineHTML() {
        // Generate odds display
        const oddsHTML = Object.entries(TARGET_CONFIG)
            .map(([target, config]) => `
                <div class="slots-odd-item">
                    <span class="slots-odd-symbol">${config.symbol}</span>
                    <span class="slots-odd-multiplier">${config.multiplier}</span>
                </div>
            `).join('');

        return `
            <div class="slots-header">🎰 LUCKY SLOTS 🎰</div>
            <div class="slots-balance" id="token-balance">Tokens: Loading...</div>

            <div class="slots-bet-container">
                <label class="slots-bet-label">BET AMOUNT:</label>
                <input type="number" class="slots-bet-input" id="bet-input" value="100" min="100" max="10000000" step="1">
            </div>

            <div class="slots-odds-container">
                <div class="slots-odds-title">Multipliers</div>
                <div class="slots-odds-grid">
                    ${oddsHTML}
                </div>
            </div>

            <div class="slots-reels">
                <div class="slots-reel" id="reel-1">🍒</div>
                <div class="slots-reel" id="reel-2">🍋</div>
                <div class="slots-reel" id="reel-3">🍇</div>
            </div>

            <div class="slots-controls">
                <div class="slots-status" id="slot-status">Press SPIN to play!</div>
                <button class="slots-btn" id="spin-btn">🎲 SPIN 🎲</button>
            </div>
        `;
    }

    // Game Logic
    function initGame(container) {
        const btn = container.querySelector('#spin-btn');
        const status = container.querySelector('#slot-status');
        const balanceDisplay = container.querySelector('#token-balance');
        const betInput = container.querySelector('#bet-input');
        const reels = [
            container.querySelector('#reel-1'),
            container.querySelector('#reel-2'),
            container.querySelector('#reel-3')
        ];

        let currentBalance = 0;

        function formatNumber(num) {
            return Math.abs(Math.round(num)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        // Fetch initial balance
        async function fetchBalance() {
            try {
                const response = await fetch("https://case-clicker.com/api/me", {
                    "credentials": "include",
                    "headers": {
                        "User-Agent": navigator.userAgent,
                        "Accept": "*/*"
                    }
                });
                const data = await response.json();
                currentBalance = data.tokens || 0;
                balanceDisplay.textContent = `Tokens: ${formatNumber(currentBalance)}`;
            } catch (error) {
                balanceDisplay.textContent = "Tokens: Error loading";
            }
        }

        fetchBalance();

        btn.addEventListener('click', async () => {
            if (btn.disabled) return;

            // Get bet amount from input
            const betAmount = parseInt(betInput.value) || 100;
            if (betAmount < 100) {
                status.textContent = "Bet must be at least 100 tokens!";
                status.classList.add('slots-lose');
                return;
            }
            if (betAmount > 10000000) {
                status.textContent = "Bet cannot exceed 10,000,000 tokens!";
                status.classList.add('slots-lose');
                return;
            }

            // Get random target number with weighted selection
            const targetNumber = getRandomTarget();
            const targetSymbol = TARGET_CONFIG[targetNumber].symbol;

            // Start Spin
            btn.disabled = true;
            betInput.disabled = true;
            status.textContent = "Spinning...";
            status.className = "slots-status";

            // Interval definitions to simulate spinning visual
            const intervals = [];

            reels.forEach((reel, index) => {
                reel.classList.add('spinning');
                const interval = setInterval(() => {
                    reel.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
                }, 50); // Faster symbol changes for more excitement
                intervals.push(interval);
            });

            try {
                // Send fetch request to casino API
                const response = await fetch("https://case-clicker.com/api/casino/dice", {
                    "credentials": "include",
                    "headers": {
                        "User-Agent": navigator.userAgent,
                        "Accept": "*/*",
                        "Accept-Language": navigator.language || "en-US,en;q=0.5",
                        "Content-Type": "application/json",
                        "Sec-Fetch-Dest": "empty",
                        "Sec-Fetch-Mode": "cors",
                        "Sec-Fetch-Site": "same-origin",
                        "Priority": "u=0"
                    },
                    "referrer": "https://case-clicker.com/game/dice",
                    "body": JSON.stringify({
                        "bet": betAmount,
                        "targetNumber": targetNumber,
                        "playerChoice": "over"
                    }),
                    "method": "POST",
                    "mode": "cors"
                });

                const result = await response.json();
                console.log("API Response:", result); // Debug logging
                const isWin = result.outcome === "win";

                // Determine symbols to display
                let finalSymbols;
                if (isWin) {
                    // Show matching symbols on win
                    finalSymbols = [targetSymbol, targetSymbol, targetSymbol];
                } else {
                    // Show different symbols on loss - ensure NOT all matching
                    const otherSymbols = SYMBOLS.filter(s => s !== targetSymbol);
                    const symbol1 = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
                    const symbol2 = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];

                    // Ensure third symbol is different from first if first two match
                    let symbol3;
                    if (symbol1 === symbol2) {
                        // Pick a different symbol for the third reel
                        const differentSymbols = otherSymbols.filter(s => s !== symbol1);
                        symbol3 = differentSymbols[Math.floor(Math.random() * differentSymbols.length)];
                    } else {
                        symbol3 = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
                    }

                    finalSymbols = [symbol1, symbol2, symbol3];
                }

                // Stop logic - stagger each reel for dramatic effect
                reels.forEach((reel, index) => {
                    // Stop reels one by one with increasing delay
                    const stopDelay = SPIN_DURATION + (index * 700); // Increased stagger
                    setTimeout(() => {
                        clearInterval(intervals[index]);
                        reel.classList.remove('spinning');
                        reel.classList.add('stopping');

                        // Set final symbol
                        reel.textContent = finalSymbols[index];
                        reel.dataset.value = finalSymbols[index];

                        // Remove stopping class after animation
                        setTimeout(() => {
                            reel.classList.remove('stopping');
                        }, 500);

                        // Check win condition after last reel stops
                        if (index === 2) {
                            // Small delay before showing result for anticipation
                            setTimeout(() => {
                                // Update balance
                                currentBalance += result.tokensWonOrLost;
                                balanceDisplay.textContent = `Tokens: ${formatNumber(currentBalance)}`;

                                checkWin(result, targetNumber);
                                btn.disabled = false;
                                betInput.disabled = false;
                            }, 300);
                        }
                    }, stopDelay);
                });
            } catch (error) {
                console.error("API Error:", error);

                // Complete animation with error symbols
                reels.forEach((reel, index) => {
                    const stopDelay = SPIN_DURATION + (index * 700);
                    setTimeout(() => {
                        clearInterval(intervals[index]);
                        reel.classList.remove('spinning');
                        reel.classList.add('stopping');
                        reel.textContent = '⚠️';

                        setTimeout(() => reel.classList.remove('stopping'), 500);

                        if (index === 2) {
                            setTimeout(() => {
                                status.textContent = "Error";
                                status.classList.add('slots-lose');
                                btn.disabled = false;
                                betInput.disabled = false;
                            }, 300);
                        }
                    }, stopDelay);
                });
            }
        });

        function checkWin(apiResult, targetNumber) {
            // Use API result
            if (apiResult) {
                const outcome = apiResult.outcome; // "win" or "lose"
                const tokensWonOrLost = apiResult.tokensWonOrLost;

                // Check if tokensWonOrLost is valid
                if (tokensWonOrLost === undefined || tokensWonOrLost === null || isNaN(tokensWonOrLost)) {
                    console.error("Invalid API response:", apiResult);
                    // Display warning symbols on reels
                    reels.forEach(reel => {
                        reel.textContent = '⚠️';
                    });
                    status.textContent = "Error";
                    status.classList.add('slots-lose');
                    return;
                }

                if (outcome === "win") {
                    // Only show JACKPOT for 93x (target 99)
                    if (targetNumber === 99) {
                        status.textContent = `JACKPOT! Won ${formatNumber(tokensWonOrLost)} tokens!`;
                    } else {
                        status.textContent = `WIN! Won ${formatNumber(tokensWonOrLost)} tokens!`;
                    }
                    status.classList.add('slots-win');
                    status.classList.remove('slots-lose');
                } else {
                    status.textContent = `Lost ${formatNumber(tokensWonOrLost)} tokens. Try again!`;
                    status.classList.add('slots-lose');
                    status.classList.remove('slots-win');
                }
            }
        }
    }

    // Track if we've already replaced on this page
    let hasReplaced = false;

    // Main replacement logic
    function replaceTarget() {
        // Only run on /game/dice page
        if (!window.location.pathname.includes('/game/dice')) {
            return;
        }

        // Don't replace if already done
        if (hasReplaced) return;

        // We look for a mantine card that specifically contains text from the snippet
        // like "Roll over 38 to win" or specific class combos, to avoid breaking other cards.
        const cards = document.querySelectorAll('.mantine-Card-root');

        for (let card of cards) {
            // Check if this card contains the unique elements from your snippet
            if (card.textContent.includes("Roll over") ||
                card.textContent.includes("Win Chance") ||
                (card.querySelector('input') && card.querySelector('.mantine-Slider-root'))) {

                // Double check to ensure we haven't already replaced it
                if (card.classList.contains('slots-container')) return;

                console.log("Target Betting Interface Found. Replacing...");

                // Inject Styles
                const styleSheet = document.createElement("style");
                styleSheet.innerText = STYLES;
                document.head.appendChild(styleSheet);

                // Clear existing HTML
                card.innerHTML = createSlotMachineHTML();

                // Add new class and remove old formatting classes that might conflict
                card.className = "slots-container";
                card.style = ""; // Clear inline styles

                // Initialize Game
                initGame(card);

                hasReplaced = true;
                break;
            }
        }
    }

    // Observe the document for changes (in case the element loads dynamically via AJAX/React)
    const observer = new MutationObserver((mutations) => {
        replaceTarget();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Watch for URL changes (for SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            hasReplaced = false; // Reset when URL changes
            replaceTarget();
        }
    }).observe(document.body, { childList: true, subtree: true });

    // Try immediately in case it's already there
    replaceTarget();

})();
