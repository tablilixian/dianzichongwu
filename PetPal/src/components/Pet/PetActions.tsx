import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { usePetStore } from '../../stores/petStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress, color = COLORS.button }) => {
  const scale = useSharedValue(1);
  const handlePressIn = () => { scale.value = withSpring(0.95); };
  const handlePressOut = () => { scale.value = withSpring(1); };
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  
  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.button, { backgroundColor: color }, animatedStyle]}>
        <Text style={styles.buttonIcon}>{icon}</Text>
        <Text style={styles.buttonLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};

interface PetActionsProps {
  onFeed?: () => void;
  onWater?: () => void;
  onBathe?: () => void;
  onPet?: () => void;
}

export const PetActions: React.FC<PetActionsProps> = ({ onFeed, onWater, onBathe, onPet }) => {
  const pet = usePetStore();
  
  const stageText = pet.stage === 'baby' ? '幼年期' : pet.stage === 'young' ? '青年期' : pet.stage === 'adult' ? '成年期' : '进化体';
  
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ActionButton icon="🍖" label="喂食" onPress={() => { pet.feed(); onFeed?.(); }} color={COLORS.hunger} />
        <ActionButton icon="💧" label="喝水" onPress={() => { pet.water(); onWater?.(); }} color={COLORS.thirst} />
        <ActionButton icon="🛁" label="洗澡" onPress={() => { pet.bathe(); onBathe?.(); }} color={COLORS.hygiene} />
        <ActionButton icon="✋" label="抚摸" onPress={() => { pet.pet(); onPet?.(); }} color={COLORS.intimacy} />
      </View>
      <View style={styles.stageInfo}>
        <Text style={styles.stageLabel}>成长阶段: {stageText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.md },
  button: { alignItems: 'center', justifyContent: 'center', width: 70, height: 70, borderRadius: BORDER_RADIUS.lg },
  buttonIcon: { fontSize: 28 },
  buttonLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textWhite, fontWeight: '600', marginTop: SPACING.xs },
  stageInfo: { alignItems: 'center', padding: SPACING.sm, backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.md },
  stageLabel: { fontSize: FONT_SIZES.sm, color: COLORS.text, fontWeight: '500' },
});
