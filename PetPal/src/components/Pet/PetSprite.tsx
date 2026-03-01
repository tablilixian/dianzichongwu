import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { usePetStore } from '../../stores/petStore';
import { useThemeStore } from '../../stores/themeStore';
import { getColors, FONT_SIZES } from '../../constants/theme';
import { STATUS_THRESHOLDS } from '../../types/pet';

// 线条小狗风格 - 使用简约线条风格的emoji
const PET_EMOJIS: Record<string, string> = {
  baby: '🐶',
  young: '🐕',
  adult: '🐩',
  evolved: '🐕‍🦺',
};

// 表情 - 使用线条符号
const FACE_EMOJIS: Record<string, string> = {
  happy: '^_^',
  normal: '•ω•',
  worried: '︵_︵',
  critical: '╥_╥',
  sick: '✕_✕',
};

interface PetSpriteProps {
  onInteract?: () => void;
}

export const PetSprite: React.FC<PetSpriteProps> = ({ onInteract }) => {
  const pet = usePetStore();
  const theme = useThemeStore();
  const COLORS = getColors(theme.isDarkMode);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const bounce = useSharedValue(0);
  
  const petEmoji = PET_EMOJIS[pet.stage] || PET_EMOJIS.baby;
  
  const getFace = () => {
    const minStatus = Math.min(pet.hunger, pet.thirst, pet.hygiene, pet.mood);
    if (minStatus <= 0) return FACE_EMOJIS.sick;
    if (minStatus < STATUS_THRESHOLDS.worried) return FACE_EMOJIS.critical;
    if (minStatus < STATUS_THRESHOLDS.normal) return FACE_EMOJIS.worried;
    if (minStatus < STATUS_THRESHOLDS.happy) return FACE_EMOJIS.normal;
    return FACE_EMOJIS.happy;
  };
  
  const handlePet = () => {
    scale.value = withSequence(withTiming(1.15, { duration: 100 }), withSpring(1));
    rotation.value = withSequence(withTiming(5, { duration: 100 }), withTiming(-5, { duration: 100 }), withTiming(0, { duration: 100 }));
    pet.pet();
    onInteract?.();
  };
  
  React.useEffect(() => {
    bounce.value = withRepeat(withSequence(withTiming(-5, { duration: 1500 }), withTiming(0, { duration: 1500 })), -1, true);
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }, { translateY: bounce.value }],
  }));
  
  // 线条风格使用虚线边框和半透明背景
  return (
    <Pressable onPress={handlePet} style={styles.container}>
      <Animated.View style={[
        styles.petContainer, 
        animatedStyle, 
        { 
          backgroundColor: theme.isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          borderWidth: 2,
          borderColor: COLORS.primaryDark,
          borderStyle: 'dashed',
        }
      ]}>
        <Text style={[styles.petEmoji, { color: COLORS.primaryDark }]}>{petEmoji}</Text>
        <View style={[styles.faceContainer, { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primaryDark, borderStyle: 'dashed' }]}>
          <Text style={[styles.faceEmoji, { color: COLORS.primaryDark }]}>{getFace()}</Text>
        </View>
      </Animated.View>
      <Text style={[styles.tapHint, { color: COLORS.textLight }]}>点击抚摸 ✋</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  petContainer: { 
    width: 140, 
    height: 140, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 20,
  },
  petEmoji: { fontSize: 70, textAlign: 'center', opacity: 0.9 },
  faceContainer: { 
    position: 'absolute', 
    bottom: 18, 
    right: 18, 
    borderRadius: 12, 
    padding: 6,
  },
  faceEmoji: { fontSize: 14, fontWeight: '600', letterSpacing: 1 },
  tapHint: { marginTop: 16, fontSize: FONT_SIZES.sm },
});
