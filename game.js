// Video Poker Game - Professional Implementation with Animations & Sound
// Jack or Better rules with 5-hand display

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.initialized = false;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Resume on first user interaction
            document.addEventListener('click', () => this.resumeContext());
            document.addEventListener('touchend', () => this.resumeContext());
        } catch (e) {
            console.log('Audio context not available');
        }
    }

    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    playCardFlip() {
        if (!this.audioContext || this.audioContext.state === 'suspended') return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Create whoosh effect
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        // Swoosh up then down
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(150, now);
        osc1.frequency.exponentialRampToValueAtTime(400, now + 0.15);
        osc1.frequency.exponentialRampToValueAtTime(200, now + 0.25);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(250, now);
        osc2.frequency.exponentialRampToValueAtTime(350, now + 0.2);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.02, now + 0.25);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);

        // Add pop at start
        const pop = ctx.createOscillator();
        const popGain = ctx.createGain();
        pop.connect(popGain);
        popGain.connect(ctx.destination);

        pop.frequency.value = 100;
        popGain.gain.setValueAtTime(0.08, now);
        popGain.gain.exponentialRampToValueAtTime(0, now + 0.05);
        pop.start(now);
        pop.stop(now + 0.05);
    }

    playWinBell() {
        if (!this.audioContext || this.audioContext.state === 'suspended') return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Bell sound - complex tone
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            const freq = [800, 1200, 1600][i];
            const delay = i * 0.02;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + delay + 0.4);

            gain.gain.setValueAtTime(0.12 / (i + 1), now + delay);
            gain.gain.exponentialRampToValueAtTime(0, now + delay + 0.4);

            osc.start(now + delay);
            osc.stop(now + delay + 0.4);
        }
    }

    playCredit() {
        if (!this.audioContext || this.audioContext.state === 'suspended') return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Ding sound for each credit
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.value = 700;

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    playCreditCountdown(credits) {
        if (!this.audioContext || credits === 0) return;

        const soundCount = Math.min(credits, 25);
        for (let i = 0; i < soundCount; i++) {
            setTimeout(() => this.playCredit(), i * 50);
        }
    }

    playButtonPress() {
        if (!this.audioContext || this.audioContext.state === 'suspended') return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.08);
    }
}

class VideoPokerGame {
    constructor() {
        // Game state
        this.credits = 1000;
        this.bet = 1;
        this.gameState = 'idle'; // idle, dealing, holding, drawing, results
        this.mainHand = [];
        this.held = [false, false, false, false, false];
        this.dealtHands = [[], [], [], []];
        this.winningHandsData = [];
        this.roundWinnings = 0;

        // UI Navigation
        this.highlightedButton = 'deal';
        this.selectedCardIndex = 0;
        this.showingPayouts = false;

        // Audio manager
        this.audio = new AudioManager();

        // Payout table for Jack or Better (per credit bet)
        this.payoutTable = {
            'Royal Flush': 250,
            'Straight Flush': 50,
            'Four of a Kind': 25,
            'Full House': 9,
            'Flush': 6,
            'Straight': 4,
            'Three of a Kind': 3,
            'Two Pair': 2,
            'Jacks or Better': 1
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.generatePayoutTable();
    }

    setupEventListeners() {
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        }, { passive: true });

        // Button click handlers for testing
        document.getElementById('payoutsBtn').addEventListener('click', () => this.showPayouts());
        document.getElementById('betBtn').addEventListener('click', () => this.cycleBet());
        document.getElementById('dealBtn').addEventListener('click', () => this.handleDealClick());
    }

    handleSwipe(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const threshold = 40;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > threshold) {
                this.swipeRight();
            } else if (deltaX < -threshold) {
                this.swipeLeft();
            }
        } else {
            // Vertical swipe
            if (deltaY > threshold) {
                this.swipeDown();
            } else if (deltaY < -threshold) {
                this.swipeUp();
            }
        }
    }

    swipeLeft() {
        if (this.showingPayouts) return;

        if (this.gameState === 'idle') {
            this.moveButtonHighlight(-1);
        } else if (this.gameState === 'holding') {
            this.moveCardSelection(-1);
        }
    }

    swipeRight() {
        if (this.showingPayouts) return;

        if (this.gameState === 'idle') {
            this.moveButtonHighlight(1);
        } else if (this.gameState === 'holding') {
            this.moveCardSelection(1);
        }
    }

    swipeDown() {
        if (this.showingPayouts || this.gameState !== 'holding') return;
        this.moveToDrawButton();
    }

    swipeUp() {
        if (this.showingPayouts) {
            this.closePayouts();
            return;
        }

        if (this.gameState === 'idle') {
            if (this.highlightedButton === 'deal') {
                this.deal();
            } else if (this.highlightedButton === 'bet') {
                this.cycleBet();
            } else if (this.highlightedButton === 'payouts') {
                this.showPayouts();
            }
        } else if (this.gameState === 'holding') {
            if (this.highlightedButton === 'draw') {
                this.draw();
            } else if (typeof this.highlightedButton === 'number') {
                this.toggleHold(this.highlightedButton);
            }
        }
    }

    moveButtonHighlight(direction) {
        const buttons = ['payouts', 'bet', 'deal'];
        let currentIndex = buttons.indexOf(this.highlightedButton);

        if (currentIndex === -1) currentIndex = 2;

        currentIndex = (currentIndex + direction + buttons.length) % buttons.length;
        this.highlightedButton = buttons[currentIndex];
        this.audio.playButtonPress();
        this.updateUI();
    }

    moveCardSelection(direction) {
        this.selectedCardIndex = (this.selectedCardIndex + direction + 5) % 5;
        this.highlightedButton = this.selectedCardIndex;
        this.audio.playButtonPress();
        this.updateUI();
    }

    moveToDrawButton() {
        this.highlightedButton = 'draw';
        this.audio.playButtonPress();
        this.updateUI();
    }

    cycleBet() {
        const bets = [1, 5, 10, 100, 500];
        const currentIndex = bets.indexOf(this.bet);
        let nextIndex = (currentIndex + 1) % bets.length;

        this.bet = bets[nextIndex];
        this.audio.playButtonPress();
        this.updateUI();
        this.generatePayoutTable();
    }

    deal() {
        if (this.credits < this.bet) {
            alert('Not enough credits to bet!');
            return;
        }

        this.credits -= this.bet;
        this.gameState = 'dealing';
        this.held = [false, false, false, false, false];
        this.winningHandsData = [];

        // Deal main hand
        this.mainHand = this.generateHand();

        // Deal 4 secondary hands
        for (let i = 0; i < 4; i++) {
            this.dealtHands[i] = this.generateHand();
        }

        this.animateDealing();
    }

    generateHand() {
        const deck = this.createDeck();
        const hand = [];
        for (let i = 0; i < 5; i++) {
            const randomIndex = Math.floor(Math.random() * deck.length);
            hand.push(deck[randomIndex]);
        }
        return hand;
    }

    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
        const deck = [];

        for (let suit of suits) {
            for (let value of values) {
                deck.push(value + suit);
            }
        }
        return deck;
    }

    animateDealing() {
        this.updateUI();
        let cardIndex = 0;
        const dealInterval = setInterval(() => {
            if (cardIndex < 5) {
                this.audio.playCardFlip();
                // Add dealing animation class to cards
                const mainCards = document.querySelectorAll('#mainCards .card');
                if (mainCards[cardIndex]) {
                    mainCards[cardIndex].classList.add('dealing');
                }
                cardIndex++;
            } else {
                clearInterval(dealInterval);
                this.gameState = 'holding';
                this.selectedCardIndex = 0;
                this.highlightedButton = 0;
                this.updateUI();
            }
        }, 200);
    }

    toggleHold(cardIndex) {
        this.held[cardIndex] = !this.held[cardIndex];
        this.audio.playButtonPress();
        this.updateUI();
    }

    draw() {
        this.gameState = 'drawing';
        const deck = this.createDeck();

        // Animate drawing cards
        let cardIndex = 0;
        const drawInterval = setInterval(() => {
            if (cardIndex < 5) {
                if (!this.held[cardIndex]) {
                    this.mainHand[cardIndex] = deck[Math.floor(Math.random() * deck.length)];
                    this.audio.playCardFlip();

                    // Replace in secondary hands
                    for (let handIdx = 0; handIdx < 4; handIdx++) {
                        this.dealtHands[handIdx][cardIndex] = deck[Math.floor(Math.random() * deck.length)];
                    }

                    // Add animation
                    const mainCards = document.querySelectorAll('#mainCards .card');
                    if (mainCards[cardIndex]) {
                        mainCards[cardIndex].classList.add('dealing');
                    }
                }
                cardIndex++;
                this.updateUI();
            } else {
                clearInterval(drawInterval);
                setTimeout(() => this.evaluateHands(), 300);
            }
        }, 200);
    }

    evaluateHands() {
        this.gameState = 'results';
        this.winningHandsData = [];
        this.roundWinnings = 0;

        // Evaluate all hands
        const mainRank = this.rankHand(this.mainHand);
        const secondaryRanks = this.dealtHands.map(hand => this.rankHand(hand));

        // Count winning hands by type
        const winningCount = {};

        // Check main hand
        if (mainRank.name !== 'High Card') {
            if (!winningCount[mainRank.name]) winningCount[mainRank.name] = 0;
            winningCount[mainRank.name]++;
            this.roundWinnings += mainRank.payout * this.bet;
        }

        // Check secondary hands
        secondaryRanks.forEach(rank => {
            if (rank.name !== 'High Card') {
                if (!winningCount[rank.name]) winningCount[rank.name] = 0;
                winningCount[rank.name]++;
                this.roundWinnings += rank.payout * this.bet;
            }
        });

        // Build winning hands display
        for (let handName in winningCount) {
            const handPayout = this.payoutTable[handName] * this.bet * winningCount[handName];
            this.winningHandsData.push({
                name: handName,
                count: winningCount[handName],
                payout: handPayout
            });
        }

        // Sort by payout descending
        this.winningHandsData.sort((a, b) => b.payout - a.payout);

        // Add credits
        this.credits += this.roundWinnings;

        // Highlight winning hands
        if (this.roundWinnings > 0) {
            this.audio.playWinBell();
            this.highlightWinningHands();
            
            // Play credit sounds
            setTimeout(() => {
                this.audio.playCreditCountdown(this.roundWinnings);
            }, 400);
        }

        // Show results after delay
        setTimeout(() => {
            this.showResults();
        }, 1000);
    }

    highlightWinningHands() {
        const hands = ['mainHand', 'hand2', 'hand3', 'hand4', 'hand5'];
        const allRanks = [this.rankHand(this.mainHand), ...this.dealtHands.map(h => this.rankHand(h))];

        allRanks.forEach((rank, idx) => {
            if (rank.name !== 'High Card') {
                const handEl = document.getElementById(hands[idx]);
                if (handEl) {
                    handEl.classList.add('winning');
                    setTimeout(() => handEl.classList.remove('winning'), 1200);
                }
            }
        });
    }

    rankHand(hand) {
        const rankMap = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
        const suitMap = { '♠': 0, '♥': 1, '♦': 2, '♣': 3 };

        const values = hand.map(card => rankMap[card[0]]).sort((a, b) => b - a);
        const suits = hand.map(card => suitMap[card[1]]);

        const isFlush = suits.every(s => s === suits[0]);
        const isStraight = this.isStraight(values);

        const counts = {};
        values.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const countArray = Object.values(counts).sort((a, b) => b - a);

        // Determine rank
        if (isStraight && isFlush && values[0] === 14 && values[4] === 10) {
            return { name: 'Royal Flush', payout: this.payoutTable['Royal Flush'] };
        } else if (isStraight && isFlush) {
            return { name: 'Straight Flush', payout: this.payoutTable['Straight Flush'] };
        } else if (countArray[0] === 4) {
            return { name: 'Four of a Kind', payout: this.payoutTable['Four of a Kind'] };
        } else if (countArray[0] === 3 && countArray[1] === 2) {
            return { name: 'Full House', payout: this.payoutTable['Full House'] };
        } else if (isFlush) {
            return { name: 'Flush', payout: this.payoutTable['Flush'] };
        } else if (isStraight) {
            return { name: 'Straight', payout: this.payoutTable['Straight'] };
        } else if (countArray[0] === 3) {
            return { name: 'Three of a Kind', payout: this.payoutTable['Three of a Kind'] };
        } else if (countArray[0] === 2 && countArray[1] === 2) {
            return { name: 'Two Pair', payout: this.payoutTable['Two Pair'] };
        } else if (countArray[0] === 2 && values[0] >= 11) {
            return { name: 'Jacks or Better', payout: this.payoutTable['Jacks or Better'] };
        } else {
            return { name: 'High Card', payout: 0 };
        }
    }

    isStraight(values) {
        for (let i = 0; i < 4; i++) {
            if (values[i] - values[i + 1] !== 1) {
                if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
                    return true;
                }
                return false;
            }
        }
        return true;
    }

    showResults() {
        const modal = document.getElementById('resultsDisplay');
        const winningsHtml = this.winningHandsData.map(hand =>
            `<div class="winning-hand-item">
                <div class="hand-name">${hand.name}</div>
                <div class="hand-count">×${hand.count}</div>
                <div class="hand-payout">${hand.payout}cr</div>
            </div>`
        ).join('');

        document.getElementById('resultsWinningHands').innerHTML = winningsHtml || '<div style="color: #FFD700; padding: 10px; text-align: center;">No winning hand</div>';
        document.getElementById('totalWon').textContent = this.roundWinnings;
        modal.classList.add('show');

        // Return to idle after delay
        setTimeout(() => {
            modal.classList.remove('show');
            this.gameState = 'idle';
            this.highlightedButton = 'deal';
            this.updateUI();
        }, 2500);
    }

    showPayouts() {
        this.showingPayouts = true;
        const modal = document.getElementById('payoutsModal');
        modal.classList.add('show');
    }

    closePayouts() {
        this.showingPayouts = false;
        document.getElementById('payoutsModal').classList.remove('show');
    }

    generatePayoutTable() {
        const table = document.getElementById('payoutsTable');
        let html = '';

        const handOrder = [
            'Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House',
            'Flush', 'Straight', 'Three of a Kind', 'Two Pair', 'Jacks or Better'
        ];

        for (let hand of handOrder) {
            const payout = this.payoutTable[hand] * this.bet;
            html += `<div class="payout-row">
                <div class="payout-hand">${hand}</div>
                <div class="payout-amount">${payout}</div>
            </div>`;
        }

        table.innerHTML = html;
    }

    handleDealClick() {
        if (this.gameState === 'idle' && this.highlightedButton === 'deal') {
            this.deal();
        } else if (this.gameState === 'holding' && this.highlightedButton === 'draw') {
            this.draw();
        }
    }

    updateUI() {
        // Update credits
        document.getElementById('creditsDisplay').textContent = this.credits;
        document.getElementById('betDisplay').textContent = this.bet;

        // Update button highlights
        document.getElementById('dealBtn').classList.toggle('highlighted', 
            (this.highlightedButton === 'deal' && this.gameState === 'idle') ||
            (this.highlightedButton === 'draw' && this.gameState === 'holding'));
        document.getElementById('betBtn').classList.toggle('highlighted', this.highlightedButton === 'bet');
        document.getElementById('payoutsBtn').classList.toggle('highlighted', this.highlightedButton === 'payouts');

        // Update deal button text
        if (this.gameState === 'holding') {
            document.getElementById('dealBtn').textContent = 'DRAW';
        } else {
            document.getElementById('dealBtn').textContent = 'DEAL';
        }

        // Display hands
        this.displayMainHand();
        this.displaySecondaryHands();
    }

    displayMainHand() {
        const container = document.getElementById('mainCards');
        container.innerHTML = '';

        if (this.mainHand.length === 0) return;

        this.mainHand.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.innerHTML = `<div class="card-value">${card}</div>`;

            if (this.gameState === 'holding' && this.highlightedButton === index) {
                cardEl.classList.add('highlighted');
            }
            if (this.held[index]) {
                cardEl.classList.add('held');
            }

            container.appendChild(cardEl);
        });
    }

    displaySecondaryHands() {
        for (let handIdx = 0; handIdx < 4; handIdx++) {
            const container = document.getElementById(`hand${handIdx + 2}Cards`);
            container.innerHTML = '';

            if (this.dealtHands[handIdx].length === 0) return;

            this.dealtHands[handIdx].forEach((card, index) => {
                const cardEl = document.createElement('div');
                cardEl.className = 'card';
                cardEl.innerHTML = `<div class="card-value">${card}</div>`;

                if (this.held[index]) {
                    cardEl.classList.add('held');
                }

                container.appendChild(cardEl);
            });
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new VideoPokerGame();
});
