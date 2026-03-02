import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useThemeStore } from '../../stores/themeStore';
import { useApiStore } from '../../stores/apiStore';
import { usePetStore } from '../../stores/petStore';
import { useChatStore } from '../../stores/chatStore';
import { sendChatMessage, ChatMessage } from '../../services/chatService';
import { getColors, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ visible, onClose }) => {
  const theme = useThemeStore();
  const apiStore = useApiStore();
  const pet = usePetStore();
  const chatStore = useChatStore();
  const COLORS = getColors(theme.isDarkMode);

  const messages = chatStore.messages;
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load chat data when modal opens
  useEffect(() => {
    if (visible) {
      chatStore.loadChatData();
      setIsInitialized(true);
    }
  }, [visible]);

  // Initial greeting when opened with no messages
  useEffect(() => {
    if (visible && isInitialized && messages.length === 0) {
      chatStore.addMessage({
        id: '1',
        role: 'assistant',
        content: '汪汪！你好呀！我是你的宠物小伙伴，有什么想和我聊的吗？🐶',
        timestamp: Date.now()
      });
    }
  }, [visible, isInitialized]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };
    
    chatStore.addMessage(userMessage);
    setInputText('');
    setIsLoading(true);
    
    try {
      const response = await sendChatMessage(userMessage.content, messages);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      chatStore.addMessage(assistantMessage);
      pet.pet();
    } catch (error) {
      Alert.alert('发送失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <KeyboardAvoidingView style={[styles.container, { backgroundColor: COLORS.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: COLORS.textLight }] }>
          <Text style={[styles.headerTitle, { color: COLORS.primaryDark }]}>汪汪聊天</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: COLORS.primary }]}>关闭</Text>
          </Pressable>
        </View>

        <ScrollView ref={scrollViewRef} style={styles.messageList} contentContainerStyle={styles.messageContent} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}>
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userMessage : styles.assistantMessage]}>
              <Text style={[styles.messageText, { color: msg.role === 'user' ? '#fff' : COLORS.text }]}>{msg.content}</Text>
            </View>
          ))}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={[styles.loadingText, { color: COLORS.textLight }]}>汪汪正在思考...</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { borderTopColor: COLORS.textLight }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.isDarkMode ? '#2A2A3E' : '#F5F5F5', color: COLORS.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="和汪汪说些什么..."
            placeholderTextColor="#999"
            multiline
            maxLength={200}
            onSubmitEditing={handleSend}
          />
          <Pressable style={[styles.sendButton, { backgroundColor: COLORS.primary }, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]} onPress={handleSend} disabled={!inputText.trim() || isLoading}>
            <Text style={styles.sendButtonText}>发送</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold' },
  closeButton: { padding: SPACING.sm },
  closeText: { fontWeight: '600' },
  messageList: { flex: 1 },
  messageContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  messageBubble: { maxWidth: '80%', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.sm },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#4A90D9', borderBottomRightRadius: 4 },
  assistantMessage: { alignSelf: 'flex-start', backgroundColor: '#F0F0F0', borderBottomLeftRadius: 4 },
  messageText: { fontSize: FONT_SIZES.md, lineHeight: 22 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  loadingText: { marginLeft: SPACING.md, fontSize: FONT_SIZES.sm },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: SPACING.md, borderTopWidth: 1, gap: SPACING.md },
  input: { flex: 1, maxHeight: 100, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, fontSize: FONT_SIZES.md },
  sendButton: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.lg },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#FFF', fontWeight: '600', fontSize: FONT_SIZES.md },
});
