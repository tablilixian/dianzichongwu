import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, View, TextInput, Pressable, Alert, StyleSheet } from 'react-native';
import { usePetStore } from '../stores/petStore';
import { useThemeStore } from '../stores/themeStore';
import { useApiStore } from '../stores/apiStore';
import { useChatStore, AGE_GROUP_LABELS, AgeGroup } from '../stores/chatStore';
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface SettingsScreenProps {
  onBack?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const pet = usePetStore();
  const theme = useThemeStore();
  const apiStore = useApiStore();
  const chatStore = useChatStore();
  const [apiKeyInput, setApiKeyInput] = useState(apiStore.apiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'none' | 'success' | 'error'>(() => apiStore.apiKey ? 'success' : 'none');
  const COLORS = getColors(theme.isDarkMode);

  useEffect(() => {
    chatStore.loadChatData();
  }, []);

  const handleExportChat = async () => {
    try {
      const jsonData = await chatStore.exportChatData();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `petpal_chat_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Alert.alert('导出成功', '聊天记录已导出');
    } catch (error) {
      Alert.alert('导出失败', '请稍后重试');
    }
  };

  const handleImportChat = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonData = event.target?.result as string;
          const success = await chatStore.importChatData(jsonData);
          if (success) {
            Alert.alert('导入成功', '聊天记录已导入');
          } else {
            Alert.alert('导入失败', '文件格式不正确');
          }
        } catch (error) {
          Alert.alert('导入失败', '文件格式不正确');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

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
    setValidationStatus(result.valid ? 'success' : 'error');
    if (result.valid) {
      Alert.alert('验证通过', 'BigModel API Key 已保存并验证通过！🎉');
    } else {
      Alert.alert('验证失败', result.error || '请检查 API Key');
    }
  };

  const handleAgeGroupChange = (ageGroup: AgeGroup) => {
    chatStore.setAgeGroup(ageGroup);
  };

  const handleClearChatHistory = async () => {
    const confirmed = window.confirm('确定要清理所有聊天记录吗？此操作不可恢复。');
    if (confirmed) {
      await chatStore.clearMessages();
      await chatStore.loadChatData();
      alert('聊天记录已全部删除');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

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
              {validationStatus === 'success' && apiKeyInput.length > 0 && (
                <View style={styles.validationStatus}>
                  <Text style={styles.validationSuccess}>✓ 验证通过</Text>
                </View>
              )}
              {validationStatus === 'error' && (
                <View style={styles.validationStatus}>
                  <Text style={styles.validationError}>✗ 验证失败，请检查 API Key</Text>
                </View>
              )}
              <Text style={[styles.hint, { color: COLORS.textLight }]}>获取 BigModel API Key: https://open.bigmodel.cn</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>聊天设置</Text>
          <View style={[styles.card, { backgroundColor: COLORS.card }]}>
            <View style={styles.settingItem}>
              <Text style={[styles.infoLabel, { color: COLORS.text }]}>年龄段</Text>
              <Text style={[styles.hint, { color: COLORS.textLight, textAlign: 'left', marginBottom: 12 }]}>
                选择合适的年龄段，宠物会根据年龄调整对话风格
              </Text>
              <View style={styles.ageGroupContainer}>
                {(Object.keys(AGE_GROUP_LABELS) as AgeGroup[]).map((age) => (
                  <Pressable
                    key={age}
                    style={[
                      styles.ageGroupButton,
                      { borderColor: COLORS.primaryDark },
                      chatStore.ageGroup === age && { backgroundColor: COLORS.primary }
                    ]}
                    onPress={() => handleAgeGroupChange(age)}
                  >
                    <Text style={[
                      styles.ageGroupText,
                      chatStore.ageGroup === age && { color: '#FFF' }
                    ]}>
                      {AGE_GROUP_LABELS[age]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>聊天记录</Text>
          <View style={[styles.card, { backgroundColor: COLORS.card }]}>
            <View style={styles.settingItem}>
              <Text style={[styles.infoLabel, { color: COLORS.text }]}>存储空间</Text>
              <View style={styles.storageInfo}>
                <Text style={[styles.storageText, { color: COLORS.text }]}>
                  已使用: {formatSize(chatStore.storageSize)} / 50 MB
                </Text>
                <Text style={[styles.hint, { color: COLORS.textLight }]}>
                  聊天记录越多，宠物记得的对话越多
                </Text>
              </View>
              <Pressable 
                style={[styles.clearButton, { backgroundColor: '#dc3545' }]} 
                onPress={handleClearChatHistory}
              >
                <Text style={styles.clearButtonText}>清理聊天记录</Text>
              </Pressable>
              <View style={styles.buttonRow}>
                <Pressable 
                  style={[styles.actionButton, { backgroundColor: COLORS.primary }]} 
                  onPress={handleExportChat}
                >
                  <Text style={styles.actionButtonText}>导出</Text>
                </Pressable>
                <Pressable 
                  style={[styles.actionButton, { backgroundColor: '#28a745' }]} 
                  onPress={handleImportChat}
                >
                  <Text style={styles.actionButtonText}>导入</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>宠物管理</Text>
          <View style={[styles.card, { backgroundColor: COLORS.card }]}> 
            <Pressable onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>重置宠物</Text>
            </Pressable>
            <Text style={styles.hint}>请仅使用 BigModel 进行聊天测试，确保 Key 已配置好。</Text>
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
  settingItem: { padding: SPACING.md },
  infoLabel: { fontSize: FONT_SIZES.md, fontWeight: '500', marginBottom: 6 },
  apiKeyInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 8, marginBottom: 12, fontSize: FONT_SIZES.md },
  saveButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#FFF', fontWeight: '600', fontSize: FONT_SIZES.md },
  hint: { fontSize: FONT_SIZES.sm, marginTop: 8, textAlign: 'center' },
  validationStatus: { marginTop: 8, padding: 8, borderRadius: 6, alignItems: 'center' },
  validationSuccess: { color: '#28a745', fontWeight: '600', fontSize: FONT_SIZES.sm },
  validationError: { color: '#dc3545', fontWeight: '600', fontSize: FONT_SIZES.sm },
  ageGroupContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  ageGroupButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  ageGroupText: { fontSize: FONT_SIZES.sm, fontWeight: '500' },
  storageInfo: { marginVertical: 12 },
  storageText: { fontSize: FONT_SIZES.md, fontWeight: '500' },
  clearButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  clearButtonText: { color: '#FFF', fontWeight: '600', fontSize: FONT_SIZES.md },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 12 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: '#FFF', fontWeight: '600', fontSize: FONT_SIZES.md },
  resetButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#888', alignItems: 'center' },
  resetButtonText: { color: '#FFF', fontWeight: '600' },
});
