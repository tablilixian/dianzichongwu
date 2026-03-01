import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { usePetStore } from '../../stores/petStore';
import { useThemeStore } from '../../stores/themeStore';
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { STATUS_THRESHOLDS } from '../../types/pet';

interface StatusBarProps {
  label: string;
  value: number;
  color: string;
  icon: string;
  COLORS: any;
}

const StatusBar: React.FC<StatusBarProps> = ({ label, value, color, icon, COLORS }) => {
  const width = useSharedValue(0);
  
  React.useEffect(() => {
    width.value = withTiming(value, { duration: 500 });
  }, [value]);
  
  const animatedStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  
  const getStatusColor = () => {
    if (value >= STATUS_THRESHOLDS.happy) return COLORS.statusHappy;
    if (value >= STATUS_THRESHOLDS.normal) return COLORS.statusNormal;
    if (value >= STATUS_THRESHOLDS.worried) return COLORS.statusWorried;
    return COLORS.statusCritical;
  };
  
  return (
    <View style={styles.statusBarContainer}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusIcon}>{icon}</Text>
        <Text style={[styles.statusLabel, { color: COLORS.text }]}>{label}</Text>
        <Text style={[styles.statusValue, { color: getStatusColor() }]}>{Math.round(value)}%</Text>
      </View>
      <View style={[styles.barBackground, { backgroundColor: COLORS.isDark ? '#444' : '#E0E0E0' }]}>
        <Animated.View style={[styles.barFill, animatedStyle, { backgroundColor: color }]} />
      </View>
    </View>
  );
};

export const PetStatus: React.FC = () => {
  const pet = usePetStore();
  const theme = useThemeStore();
  const COLORS = getColors(theme.isDarkMode);
  
  return (
    <View style={[styles.container, { backgroundColor: COLORS.card }]}>
      <StatusBar label="饱食" value={pet.hunger} color={COLORS.hunger} icon="🍖" COLORS={COLORS} />
      <StatusBar label="水分" value={pet.thirst} color={COLORS.thirst} icon="💧" COLORS={COLORS} />
      <StatusBar label="卫生" value={pet.hygiene} color={COLORS.hygiene} icon="🛁" COLORS={COLORS} />
      <StatusBar label="心情" value={pet.mood} color={COLORS.mood} icon="😊" COLORS={COLORS} />
      <StatusBar label="亲密度" value={pet.intimacy} color={COLORS.intimacy} icon="❤️" COLORS={COLORS} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, marginHorizontal: SPACING.md, marginVertical: SPACING.sm },
  statusBarContainer: { marginBottom: SPACING.sm },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  statusIcon: { fontSize: FONT_SIZES.md, marginRight: SPACING.xs },
  statusLabel: { flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '500' },
  statusValue: { fontSize: FONT_SIZES.sm, fontWeight: 'bold' },
  barBackground: { height: 8, borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: BORDER_RADIUS.full },
});
