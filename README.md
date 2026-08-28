# Meta Glasses Video Poker App

A fully-featured video poker game optimized for Meta Glasses, featuring 5-hand simultaneous play with Jack or Better hand rankings.

## 📋 Overview

This app recreates the classic video poker experience with support for Meta Glasses display standards (600x600px) and gesture-based controls. Play 5 hands simultaneously with authentic hand rankings, payout tables, and audio feedback.

## 🎮 Game Features

- **5-Hand Simultaneous Play**: Main hand plus 4 secondary hands
- **Jack or Better Rules**: Full hand ranking system including:
  - Royal Flush (250x bet)
  - Straight Flush (50x bet)
  - Four of a Kind (25x bet)
  - Full House (9x bet)
  - Flush (6x bet)
  - Straight (4x bet)
  - Three of a Kind (3x bet)
  - Two Pair (2x bet)
  - Jacks or Better (1x bet)

- **Flexible Betting**: Toggle between 1, 5, 10, 100, or 500 credit bets
- **Payout Table**: View all hand rankings and payouts based on current bet
- **Audio Feedback**:
  - Card flip sounds during dealing/drawing
  - Bell sound when winning hands are detected
  - Credit counting sounds for winnings

## 🎯 Gesture Controls

### Main Game (Idle State)
- **Swipe Left**: Previous button (Payouts → Bet → Deal)
- **Swipe Right**: Next button (Deal → Bet → Payouts)
- **Swipe Up**: Activate highlighted button

### Card Selection (Holding Phase)
- **Swipe Left**: Previous card (wraps around from left to right)
- **Swipe Right**: Next card (wraps around from right to left)
- **Swipe Up**: Toggle hold on highlighted card
- **Swipe Down**: Jump to Draw button

### Button Actions
- **Deal Button**: Start new hand (swipe up when highlighted)
- **Bet Button**: Cycle through bet amounts (swipe up when highlighted)
- **Payouts Button**: View payout table (swipe up when highlighted)
- **Draw Button**: Draw replacement cards (swipe up when highlighted)

### Payouts Modal
- **Swipe Up**: Return to game

## 🚀 Getting Started

### Requirements
- Web browser with HTML5, CSS3, and Web Audio API support
- Meta Glasses or 600x600px display

### How to Run

1. Open `index.html` in a web browser
2. The game starts with the **Deal** button highlighted
3. Swipe up to deal 5 hands
4. Choose which cards to hold
5. Swipe down and then up on Draw button, or just swipe up on cards to toggle hold
6. Draw replacement cards
7. Win or lose and start a new hand

## 📁 File Structure

```
meta-glasses-video-poker/
├── index.html          # Main game UI and styling
├── game.js             # Game logic and state management
├── README.md           # This file
└── LICENSE             # MIT License
```

## 🔧 Technical Details

### HTML/CSS
- **Display Size**: 600x600px (Meta Glasses optimized)
- **Color Scheme**: Neon blue (#00d4ff) and gold (#ffd700) for glass-friendly contrast
- **Responsive Layout**: Grid-based layout for multiple hand display

### JavaScript
- **Hand Evaluation**: Full poker hand ranking algorithm
- **State Management**: Game states (idle, dealing, holding, drawing, results)
- **Touch Gestures**: Swipe detection with configurable thresholds
- **Audio Synthesis**: Web Audio API for sound effects

### Browser APIs Used
- Touch Events (touchstart, touchend)
- Web Audio Context (for sound generation)
- DOM Manipulation (modern vanilla JavaScript)

## 🎨 Design Features

- **High Contrast**: Neon colors for optimal visibility on Meta Glasses
- **Clear Highlighting**: Magenta glow (#ff00ff) indicates active selections
- **Card State Indicators**: Different borders for held cards (green) vs active cards (magenta)
- **Smooth Animations**: Card flip animations and winning hand highlights

## 🔊 Sound Effects

All sounds are generated using Web Audio API (no external audio files):
- **Card Flip**: Whoosh effect at ~200-400Hz
- **Win Bell**: Sine wave at 800-600Hz with fade
- **Credit Counting**: Multiple bell tones based on credits won

## 📊 Game States

1. **Idle**: Waiting for player action (buttons highlighted)
2. **Dealing**: Animating initial hand deal with card flip sounds
3. **Holding**: Player selecting which cards to hold
4. **Drawing**: Animating replacement card deal
5. **Results**: Displaying winning hands and payouts

## 🎯 Gameplay Tips

1. Start game with Deal button (it's highlighted automatically)
2. Cards are dealt to all 5 hands simultaneously
3. Hold matching cards to improve chances across all hands
4. Payout increases with higher bets but risk is also higher
5. Check Payouts table if unsure about hand rankings

## 🏆 Hand Rankings

Hands ranked from highest to lowest value:
- Royal Flush: A-K-Q-J-T of same suit
- Straight Flush: 5 consecutive cards of same suit
- Four of a Kind: 4 cards of same rank
- Full House: 3 of a kind + Pair
- Flush: 5 cards of same suit
- Straight: 5 consecutive cards
- Three of a Kind: 3 cards of same rank
- Two Pair: 2 different pairs
- Jacks or Better: Pair of Jacks, Queens, Kings, or Aces

## 📝 Notes

- All hand evaluations follow standard poker rules
- Ace-low straights (A-2-3-4-5) are supported
- Game handles ties/no-win hands gracefully
- Credits persist during game session
- Starting balance: 1000 credits

## 🛠️ Future Enhancements

Potential improvements for future versions:
- Save game progress locally
- Stats tracking (hands played, total winnings, etc.)
- Difficulty levels
- Alternative hand rankings (Bonus Poker, Double Bonus, etc.)
- Haptic feedback support for Meta Glasses

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Feel free to fork, modify, and improve this project!

---

**Created for Meta Glasses Display SDK**
Optimized for 600x600px display with gesture-based swipe controls
