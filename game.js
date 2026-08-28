// Video Poker Game Logic for Meta Glasses
// Jack or Better rules with 5-hand display

class VideoPokerGame {
    constructor() {
        // Game state
        this.credits = 1000;
        this.bet = 1;
        this.gameState = 'idle'; // idle, dealing, holding, drawing, results
        this.hands = [[], [], [], [], []]; // 5 hands
        this.mainHand = [];
        this.held = [false, false, false, false, false];
        this.dealtHands = [[], [], [], []];
        this.winningHands = [];
        this.roundWinnings = 0;

        // UI Navigation
        this.highlightedButton = 'deal'; // deal, bet, payouts, or card index
        this.selectedCardIndex = 0;
        this.showingPayouts = false;

        // Audio context
        this.audioContext = null;

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
        this.setupAudio();
        this.setupEventListeners();
        this.updateUI();
        this.generatePayoutTable();
    }

    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio context not available');
        }
    }

    playCardFlipSound() {
        if (!this.audioContext || this.audioContext.state === 'suspended') return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Whoosh sound - card flip
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    playBingSound() {
        if (!this.audioContext || this.audioContext.state === 'suspended') return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Bell sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    playCreditSound(credits) {
        if (!this.audioContext || this.audioContext.state === 'suspended') return;

        const ctx = this.audioContext;
        const soundCount = Math.min(credits, 20); // Limit sounds

        for (let i = 0; i < soundCount; i++) {
            setTimeout(() => {
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = 'sine';
                osc.frequency.value = 600 + (i * 20);

                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0, now + 0.1);

                osc.start(now);
                osc.stop(now + 0.1);
            }, i * 100);
        }
    }

    setupEventListeners() {
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        });

        document.addEventListener('touchend', (e) => {
            if (!this.showingPayouts) {
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
            } else {
                this.handlePayoutsSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
            }
        });

        // Button click handlers for testing
        document.getElementById('payoutsBtn').addEventListener('click', () => this.showPayouts());
        document.getElementById('betBtn').addEventListener('click', () => this.cycleBet());
        document.getElementById('dealBtn').addEventListener('click', () => this.handleDealClick());
    }

    handleSwipe(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const threshold = 50;

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

    handlePayoutsSwipe(startX, startY, endX, endY) {
        const deltaY = endY - startY;
        const threshold = 50;

        if (deltaY < -threshold) {
            // Swiped up - close payouts
            this.closePayouts();
        }
    }

    swipeLeft() {
        if (this.gameState === 'idle') {
            this.moveButtonHighlight(-1);
        } else if (this.gameState === 'holding') {
            this.moveCardSelection(-1);
        }
    }

    swipeRight() {
        if (this.gameState === 'idle') {
            this.moveButtonHighlight(1);
        } else if (this.gameState === 'holding') {
            this.moveCardSelection(1);
        }
    }

    swipeDown() {
        if (this.gameState === 'holding') {
            this.moveToDrawButton();
        }
    }

    swipeUp() {
        if (this.showingPayouts) return;

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

        if (currentIndex === -1) currentIndex = 2; // default to deal

        currentIndex = (currentIndex + direction + buttons.length) % buttons.length;
        this.highlightedButton = buttons[currentIndex];
        this.updateUI();
    }

    moveCardSelection(direction) {
        this.selectedCardIndex = (this.selectedCardIndex + direction + 5) % 5;
        this.highlightedButton = this.selectedCardIndex;
        this.updateUI();
    }

    moveToDrawButton() {
        this.highlightedButton = 'draw';
        this.updateUI();
    }

    cycleBet() {
        const bets = [1, 5, 10, 100, 500];
        const currentIndex = bets.indexOf(this.bet);
        let nextIndex = (currentIndex + 1) % bets.length;

        this.bet = bets[nextIndex];
        this.updateUI();
    }

    deal() {
        if (this.credits < this.bet) {
            alert('Not enough credits to bet!');
            return;
        }

        this.credits -= this.bet;
        this.gameState = 'dealing';
        this.held = [false, false, false, false, false];

        // Deal main hand
        this.mainHand = this.generateHand();

        // Deal 4 secondary hands
        for (let i = 0; i < 4; i++) {
            this.dealtHands[i] = this.generateHand();
        }

        // Animate dealing
        this.animateDealing();
    }

    generateHand() {
        const deck = this.createDeck();
        const hand = [];
        for (let i = 0; i < 5; i++) {
            hand.push(deck[Math.floor(Math.random() * deck.length)]);
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
        let cardIndex = 0;
        const interval = setInterval(() => {
            if (cardIndex < 5) {
                this.playCardFlipSound();
                cardIndex++;
            } else {
                clearInterval(interval);
                this.gameState = 'holding';
                this.selectedCardIndex = 0;
                this.highlightedButton = 0;
                this.updateUI();
            }
        }, 150);
    }

    toggleHold(cardIndex) {
        this.held[cardIndex] = !this.held[cardIndex];
        this.updateUI();
    }

    draw() {
        this.gameState = 'drawing';
        const deck = this.createDeck();

        // Replace non-held cards in main hand
        for (let i = 0; i < 5; i++) {
            if (!this.held[i]) {
                this.mainHand[i] = deck[Math.floor(Math.random() * deck.length)];
            }
        }

        // Replace non-held cards in secondary hands
        for (let handIdx = 0; handIdx < 4; handIdx++) {
            for (let i = 0; i < 5; i++) {
                if (!this.held[i]) {
                    this.dealtHands[handIdx][i] = deck[Math.floor(Math.random() * deck.length)];
                }
            }
        }

        this.animateDrawing();
    }

    animateDrawing() {
        let cardIndex = 0;
        const interval = setInterval(() => {
            if (cardIndex < 5) {
                if (!this.held[cardIndex]) {
                    this.playCardFlipSound();
                }
                cardIndex++;
            } else {
                clearInterval(interval);
                this.evaluateHands();
            }
        }, 150);
    }

    evaluateHands() {
        this.gameState = 'results';
        this.winningHands = [];
        this.roundWinnings = 0;

        // Evaluate main hand
        const mainRank = this.rankHand(this.mainHand);

        // Evaluate secondary hands
        let winningCount = {};

        if (mainRank.name !== 'High Card') {
            this.playBingSound();
            winningCount[mainRank.name] = 1;
            this.roundWinnings = mainRank.payout * this.bet;
        }

        // Check secondary hands
        for (let i = 0; i < 4; i++) {
            const rank = this.rankHand(this.dealtHands[i]);
            if (rank.name !== 'High Card') {
                if (!winningCount[rank.name]) {
                    winningCount[rank.name] = 0;
                }
                winningCount[rank.name]++;
                const handWinnings = rank.payout * this.bet;
                this.roundWinnings += handWinnings;
            }
        }

        // Build winning hands display
        this.winningHands = [];
        for (let handName in winningCount) {
            const payout = this.payoutTable[handName] * this.bet * winningCount[handName];
            this.winningHands.push({
                name: handName,
                count: winningCount[handName],
                payout: payout
            });
        }

        // Add credits
        this.credits += this.roundWinnings;

        // Play credit counting sound
        if (this.roundWinnings > 0) {
            this.playCreditSound(this.roundWinnings);
        }

        // Show results
        setTimeout(() => {
            this.showResults();
        }, 300);
    }

    rankHand(hand) {
        const rankMap = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
        const suitMap = { '♠': 0, '♥': 1, '♦': 2, '♣': 3 };

        const values = hand.map(card => rankMap[card[0]]).sort((a, b) => b - a);
        const suits = hand.map(card => suitMap[card[1]]);

        // Check flush
        const isFlush = suits.every(s => s === suits[0]);

        // Check straight
        const isStraight = this.isStraight(values);

        // Check pair patterns
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
                // Check for A-2-3-4-5 straight
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
        const winningsHtml = this.winningHands.map(hand =>
            `<div class="winning-hand-item">
                <div class="hand-name">${hand.name}</div>
                <div class="hand-count">×${hand.count}</div>
                <div class="hand-payout">${hand.payout}cr</div>
            </div>`
        ).join('');

        document.getElementById('resultsWinningHands').innerHTML = winningsHtml || '<div style="color: #ff0000;">No winning hand this round</div>';
        document.getElementById('totalWon').textContent = this.roundWinnings;
        modal.classList.add('show');

        // Return to idle after a delay
        setTimeout(() => {
            modal.classList.remove('show');
            this.gameState = 'idle';
            this.highlightedButton = 'deal';
            this.updateUI();
        }, 3000);
    }

    showPayouts() {
        this.showingPayouts = true;
        const modal = document.getElementById('payoutsModal');
        modal.classList.add('show');
        this.updatePayoutsDisplay();
    }

    closePayouts() {
        this.showingPayouts = false;
        document.getElementById('payoutsModal').classList.remove('show');
    }

    generatePayoutTable() {
        const table = document.getElementById('payoutsTable');
        let html = '';

        for (let hand in this.payoutTable) {
            const payout = this.payoutTable[hand] * this.bet;
            html += `<div class="payout-row">
                <div class="payout-hand">${hand}</div>
                <div class="payout-amount">${payout} Credits</div>
            </div>`;
        }

        table.innerHTML = html;
    }

    updatePayoutsDisplay() {
        document.getElementById('currentBetDisplay').textContent = this.bet;
        this.generatePayoutTable();
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
        document.querySelector('.credits-display').textContent = this.credits;
        document.getElementById('betDisplay').textContent = this.bet;

        // Update button highlights
        document.getElementById('dealBtn').classList.toggle('highlighted', this.highlightedButton === 'deal' && this.gameState === 'idle');
        document.getElementById('dealBtn').classList.toggle('highlighted', this.highlightedButton === 'draw' && this.gameState === 'holding');
        document.getElementById('betBtn').classList.toggle('highlighted', this.highlightedButton === 'bet');
        document.getElementById('payoutsBtn').classList.toggle('highlighted', this.highlightedButton === 'payouts');

        // Update deal button text
        if (this.gameState === 'holding') {
            document.getElementById('dealBtn').textContent = 'DRAW';
            if (this.highlightedButton === 'draw') {
                document.getElementById('dealBtn').classList.add('highlighted');
            }
        } else {
            document.getElementById('dealBtn').textContent = 'DEAL';
        }

        // Display main hand
        this.displayMainHand();

        // Display secondary hands
        this.displaySecondaryHands();

        // Display winning hands list
        this.displayWinningHandsList();
    }

    displayMainHand() {
        const container = document.getElementById('mainCards');
        container.innerHTML = '';

        if (this.mainHand.length === 0) return;

        this.mainHand.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.textContent = card;

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
                cardEl.textContent = card;

                if (this.held[index]) {
                    cardEl.classList.add('held');
                }

                container.appendChild(cardEl);
            });
        }
    }

    displayWinningHandsList() {
        const container = document.getElementById('winningHandsList');
        if (this.gameState !== 'holding' || this.winningHands.length === 0) {
            container.innerHTML = '';
            return;
        }

        // Only show if we want to display during gameplay
        container.innerHTML = '';
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new VideoPokerGame();
});
