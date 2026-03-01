import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASKET_WIDTH = 60;
const FOOD_SIZE = 30;
const GAME_DURATION = 30;

interface Food {
  id: number;
  x: number;
  y: number;
}

export const MiniGame: React.FC<{ onClose: () => void; onScore: (score: number) => void }> = ({ onClose, onScore }) => {
  const theme = useThemeStore();
  const COLORS = getColors(theme.isDarkMode);
  
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [basketX, setBasketX] = useState(SCREEN_WIDTH / 2 - BASKET_WIDTH / 2);
  const [foods, setFoods] = useState<Food[]>([]);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const foodIdRef = useRef(0);
  const scoreRef = useRef(0);
  
  // Timer effect
  useEffect(() => {
    if (gameOver) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          onScore(scoreRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameOver, onScore]);
  
  // Game loop effect
  useEffect(() => {
    if (gameOver) return;
    
    gameLoopRef.current = setInterval(() => {
      setFoods(prev => {
        const newFoods = prev
          .map(f => ({ ...f, y: f.y + 8 }))
          .filter(f => {
            if (f.y > 400) {
              const basketCenter = basketX + BASKET_WIDTH / 2;
              const foodCenter = f.x + FOOD_SIZE / 2;
              if (Math.abs(foodCenter - basketCenter) < BASKET_WIDTH / 2 + FOOD_SIZE / 2) {
                scoreRef.current += 1;
                setScore(scoreRef.current);
                return false;
              }
            }
            return f.y < 450;
          });
        
        if (Math.random() < 0.25) {
          newFoods.push({
            id: foodIdRef.current++,
            x: Math.random() * (SCREEN_WIDTH - FOOD_SIZE - 40) + 20,
            y: -FOOD_SIZE,
          });
        }
        
        return newFoods;
      });
    }, 50);
    
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameOver, basketX]);
  
  const handleBasketMove = (direction: 'left' | 'right') => {
    setBasketX(prev => {
      if (direction === 'left') return Math.max(20, prev - 30);
      return Math.min(SCREEN_WIDTH - BASKET_WIDTH - 20, prev + 30);
    });
  };
  
  const restartGame = () => {
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setFoods([]);
    setGameOver(false);
    setBasketX(SCREEN_WIDTH / 2 - BASKET_WIDTH / 2);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={styles.header}>
        <Text style={[styles.scoreText, { color: COLORS.text }]}>得分: {score}</Text>
        <Text style={[styles.timeText, { color: timeLeft <= 10 ? COLORS.statusCritical : COLORS.text }]}>
          时间: {timeLeft}s
        </Text>
        <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: COLORS.card }]}>
          <Text style={{ color: COLORS.text }}>✕</Text>
        </Pressable>
      </View>
      
      <View style={styles.gameArea}>
        {foods.map(food => (
          <View key={food.id} style={[styles.food, { left: food.x, top: food.y }]}>
            <Text style={styles.foodEmoji}>🍎</Text>
          </View>
        ))}
        
        <View style={[styles.basket, { left: basketX }]}>
          <Text style={styles.basketEmoji}>🧺</Text>
        </View>
      </View>
      
      <View style={styles.controls}>
        <Pressable 
          onPress={() => handleBasketMove('left')} 
          style={[styles.controlButton, { backgroundColor: COLORS.primary }]}
        >
          <Text style={styles.controlText}>⬅️ 左</Text>
        </Pressable>
        <Pressable 
          onPress={() => handleBasketMove('right')} 
          style={[styles.controlButton, { backgroundColor: COLORS.primary }]}
        >
          <Text style={styles.controlText}>右 ➡️</Text>
        </Pressable>
      </View>
      
      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <View style={[styles.gameOverCard, { backgroundColor: COLORS.card }]}>
            <Text style={[styles.gameOverTitle, { color: COLORS.primaryDark }]}>游戏结束!</Text>
            <Text style={[styles.finalScore, { color: COLORS.text }]}>最终得分: {score}</Text>
            <Pressable 
              onPress={restartGame}
              style={[styles.restartButton, { backgroundColor: COLORS.primary }]}
            >
              <Text style={styles.restartText}>再来一局</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.exitButton}>
              <Text style={{ color: COLORS.textLight }}>退出</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
  scoreText: { fontSize: FONT_SIZES.xl, fontWeight: 'bold' },
  timeText: { fontSize: FONT_SIZES.lg, fontWeight: '600' },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  gameArea: { flex: 1, position: 'relative', overflow: 'hidden' },
  food: { position: 'absolute', width: FOOD_SIZE, height: FOOD_SIZE },
  foodEmoji: { fontSize: FOOD_SIZE },
  basket: { position: 'absolute', bottom: 20, width: BASKET_WIDTH, height: 40 },
  basketEmoji: { fontSize: 40 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', padding: SPACING.lg, paddingBottom: SPACING.xl },
  controlButton: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg },
  controlText: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: '#fff' },
  gameOverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  gameOverCard: { padding: SPACING.xl, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', width: '80%' },
  gameOverTitle: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', marginBottom: SPACING.md },
  finalScore: { fontSize: FONT_SIZES.xl, marginBottom: SPACING.lg },
  restartButton: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm },
  restartText: { color: '#fff', fontWeight: 'bold', fontSize: FONT_SIZES.md },
  exitButton: { padding: SPACING.sm },
});
