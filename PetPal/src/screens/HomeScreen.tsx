import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar, Pressable, Vibration } from 'react-native';
import { PetSprite, PetStatus, PetActions } from '../components/Pet';
import { MiniGame } from '../components/MiniGame';
import { ChatModal } from '../components/Chat/ChatModal';
import { usePetStore } from '../stores/petStore';
import { useThemeStore } from '../stores/themeStore';
import { useAchievementStore } from '../stores/achievementStore';
import { useApiStore } from '../stores/apiStore';
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { SettingsScreen } from './SettingsScreen';

export const HomeScreen: React.FC = () => {
  const pet = usePetStore();
  const theme = useThemeStore();
  const achievements = useAchievementStore();
  const apiStore = useApiStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const COLORS = getColors(theme.isDarkMode);
  
  useEffect(() => {
    pet.loadPet();
    theme.loadSettings();
    achievements.loadAchievements();
    apiStore.loadApiSettings();
  }, []);
  
  useEffect(() => {
    achievements.checkAndUnlock(pet);
  }, [pet.hunger, pet.thirst, pet.hygiene, pet.mood, pet.intimacy, pet.stage]);
  
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      pet.tick();
    }, 60000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  
  const playFeedback = useCallback(() => {
    if (theme.vibrationEnabled) {
      Vibration.vibrate(50);
    }
  }, [theme.vibrationEnabled]);
  
  const handleFeed = useCallback(() => { pet.feed(); playFeedback(); }, [pet, playFeedback]);
  const handleWater = useCallback(() => { pet.water(); playFeedback(); }, [pet, playFeedback]);
  const handleBathe = useCallback(() => { pet.bathe(); playFeedback(); }, [pet, playFeedback]);
  const handlePet = useCallback(() => { pet.pet(); playFeedback(); }, [pet, playFeedback]);
  
  const handleGameScore = useCallback((score: number) => {
    if (score > 0) {
      pet.mood = Math.min(100, pet.mood + score);
    }
  }, []);
  
  if (showGame) {
    return <MiniGame onClose={() => setShowGame(false)} onScore={handleGameScore} />;
  }
  
  if (showAchievements) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
        <StatusBar barStyle={theme.isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.header}>
          <Pressable onPress={() => setShowAchievements(false)}>
            <Text style={[styles.backButton, { color: COLORS.primaryDark }]}>← 返回</Text>
          </Pressable>
          <Text style={[styles.title, { color: COLORS.primaryDark }]}>成就 🏆</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView>
          {achievements.achievements.map(ach => (
            <View key={ach.id} style={[styles.achievementCard, { backgroundColor: COLORS.card }]}>
              <Text style={styles.achievementIcon}>{ach.icon}</Text>
              <View style={styles.achievementContent}>
                <Text style={[styles.achievementTitle, { color: COLORS.text }]}>{ach.title}</Text>
                <Text style={[styles.achievementDesc, { color: COLORS.textLight }]}>{ach.description}</Text>
              </View>
              {ach.unlocked && <Text style={styles.unlockedIcon}>✅</Text>}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  if (showSettings) {
    return <SettingsScreen onBack={() => setShowSettings(false)} />;
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? "light-content" : "dark-content"} backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.primaryDark }]}>PetPal 🐕</Text>
          <View style={styles.headerButtons}>
            <Pressable onPress={() => setShowChat(true)} style={styles.iconButton}>
              <Text style={styles.iconText}>💬</Text>
            </Pressable>
            <Pressable onPress={() => setShowAchievements(true)} style={styles.iconButton}>
              <Text style={styles.iconText}>🏆</Text>
            </Pressable>
            <Pressable onPress={() => setShowGame(true)} style={styles.iconButton}>
              <Text style={styles.iconText}>🎮</Text>
            </Pressable>
            <Pressable onPress={() => setShowSettings(true)} style={styles.iconButton}>
              <Text style={styles.iconText}>⚙️</Text>
            </Pressable>
          </View>
        </View>
        
        <View style={styles.petArea}>
          <PetSprite onInteract={handlePet} />
        </View>
        
        <PetStatus />
        
        <PetActions onFeed={handleFeed} onWater={handleWater} onBathe={handleBathe} onPet={handlePet} />
        
        <View style={[styles.tips, { backgroundColor: COLORS.primaryLight }]}>
          <Text style={[styles.tipsTitle, { color: COLORS.text }]}>小提示</Text>
          <Text style={[styles.tipsText, { color: COLORS.text }]}>
            • 按时喂食和喝水，保持饱食度和水分值{'\n'}
            • 经常抚摸可以增加亲密度{'\n'}
            • 卫生值低时要记得洗澡哦{'\n'}
            • 照顾好宠物，它会进化成更可爱的形态！{'\n'}
            • 点击🎮可以玩小游戏增加心情！{'\n'}
            • 点击💬可以和汪汪聊天！
          </Text>
        </View>
      </ScrollView>
      
      <ChatModal visible={showChat} onClose={() => setShowChat(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: SPACING.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row', gap: SPACING.xs },
  iconButton: { padding: SPACING.sm },
  iconText: { fontSize: 20 },
  backButton: { fontSize: FONT_SIZES.md, fontWeight: '600' },
  petArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg },
  tips: { margin: SPACING.md, padding: SPACING.md, borderRadius: 12 },
  tipsTitle: { fontSize: FONT_SIZES.md, fontWeight: '600', marginBottom: SPACING.sm },
  tipsText: { fontSize: FONT_SIZES.sm, lineHeight: 22 },
  achievementCard: { flexDirection: 'row', alignItems: 'center', margin: SPACING.sm, padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  achievementIcon: { fontSize: 32, marginRight: SPACING.md },
  achievementContent: { flex: 1 },
  achievementTitle: { fontSize: FONT_SIZES.md, fontWeight: '600' },
  achievementDesc: { fontSize: FONT_SIZES.sm, marginTop: 2 },
  unlockedIcon: { fontSize: 20 },
});
