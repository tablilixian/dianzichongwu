import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, View, TextInput, Pressable, Alert, StyleSheet } from 'react-native';
import { usePetStore } from '../stores/petStore';
import { useThemeStore } from '../stores/themeStore';
import { useApiStore } from '../stores/apiStore';
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface SettingsScreenProps {
  onBack?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const pet = usePetStore();
  const theme = useThemeStore();
  const apiStore = useApiStore();
  const [apiKeyInput, setApiKeyInput] = useState(apiStore.apiKey);
  const [isValidating, setIsValidating] = useState(false);
  const COLORS = getColors(theme.isDarkMode);

  const handleReset = () => {
    Alert.alert('重置宠物', '确定要重置宠物吗？所有进度将会丢失！', [
      { text: '取消', style: 'cancel' },
      { text: '确定', onPress: () => pet.reset(), style: 'destructive' },
    ]);
  };

  const handleSaveAndValidate = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('错误', '请输入 API Key');
      return;
    }
    setIsValidating(true);
    apiStore.setApiKey(apiKeyInput.trim());
    const result = await apiStore.validateApiKey();
    setIsValidating(false);
    if (result.valid) {
      Alert.alert('验证通过', 'BigModel API Key 已保存并验证通过！');
    } else {
      Alert.alert('验证失败', result.error || '请检查 API Key');
    }
  };

  const getDaysAlive = () => Math.floor((Date.now() - pet.createdAt) / (1000 * 60 * 60 * 24));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
      <ScrollView>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backText, { color: COLORS.primaryDark }]}>← 返回</Text>
          </Pressable>
          <Text style={[styles.title, { color: COLORS.primaryDark }]}>设置 ⚙️</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BigModel API 设置</Text>
          <View style={[styles.card, { backgroundColor: COLORS.card }]}> 
            <View style={styles.apiKeyContainer}>
              <Text style={[styles.infoLabel, { color: COLORS.text }]}>智谱 BigModel API Key</Text>
              <TextInput
                style={[styles.apiKeyInput, { backgroundColor: theme.isDarkMode ? '#2A2A3E' : '#F5F5F5', color: COLORS.text, borderColor: COLORS.primaryDark }]}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                placeholder="粘贴你的智谱 BigModel API Key..."
                placeholderTextColor="#999"
              />
              <Pressable style={[styles.saveButton, { backgroundColor: COLORS.primary }]} onPress={handleSaveAndValidate} disabled={isValidating}>
                <Text style={styles.saveButtonText}>{isValidating ? '验证中...' : '保存并验证'}</Text>
              </Pressable>
              <Text style={[styles.hint, { color: COLORS.textLight }]}>获取 BigModel API Key: https://open.bigmodel.cn</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>宠物管理</Text>
          <View style={[styles.card, { backgroundColor: COLORS.card }]}> 
            <Pressable onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>重置宠物</Text>
            </Pressable>
            <Text style={styles.hint}>请仅使用 BigModel 进行聊天测试，确保 Key 已配置好。
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.sm },
  backButton: { padding: SPACING.xs },
  backText: { fontWeight: '600' },
  title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold' },
  section: { marginBottom: SPACING.lg, paddingHorizontal: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZES.sm, color: '#888', marginBottom: SPACING.sm, marginLeft: SPACING.md },
  card: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  apiKeyContainer: { padding: SPACING.md },
  infoLabel: { fontSize: FONT_SIZES.md, fontWeight: '500', marginBottom: 6 },
  apiKeyInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 8, marginBottom: 12, fontSize: FONT_SIZES.md },
  saveButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#FFF', fontWeight: '600', fontSize: FONT_SIZES.md },
  hint: { fontSize: FONT_SIZES.sm, marginTop: 8, textAlign: 'center' },
  resetButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#888', alignItems: 'center' },
  resetButtonText: { color: '#FFF', fontWeight: '600' },
});
