import { useApiStore } from '../stores/apiStore';
import { usePetStore } from '../stores/petStore';
import { useChatStore, AgeGroup } from '../stores/chatStore';

// 检测用户是否想设置称呼
const detectNamePattern = (message: string): string | null => {
  const patterns = [
    /请?叫我[：:\s]*([^\s，。,，!！?？]+)/,
    /叫?我[叫做是]+([^\s，。,，!！?？]+)/,
    /我的名字是[：:\s]*([^\s，。,，!！?？]+)/,
    /叫我[^\s，。,，!！?？]+([^\s，。,，!！?？]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
};

// 检测用户是否想记住某样东西
const detectMemoryPattern = (message: string): { content: string; location?: string } | null => {
  const patterns = [
    /帮?我?记住[：:\s]*(.+?)(?:放?在|在|的?位置|放(?:在|到)?(.+?)$|$)/,
    /记[住得]一下[：:\s]*(.+)/,
    /帮我记[住得](.+?)(?:放?在|在|的?位置|$)/,
    /以?后?告?诉?我[：:\s]*(.+?)(?:放?在|在|$)/,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const content = match[1].trim();
      let location = match[2]?.trim();
      if (location) {
        location = location.replace(/[，。,！!?？]+$/, '').trim();
      }
      if (content && content.length > 1) {
        return { content, location: location || undefined };
      }
    }
  }
  return null;
};

// 根据年龄段获取不同的提示词
const getAgeGroupPrompt = (ageGroup: AgeGroup): { style: string; maxLength: number; opening: string } => {
  const prompts = {
    toddler: {
      style: '用非常简单、幼稚的语言，像3-6岁小朋友说话的方式。使用叠词，比如"汪汪"、"吃饭饭"、"喝水水"等。可以使用很多emoji表情。',
      maxLength: 30,
      opening: '汪汪！',
    },
    child: {
      style: '用简单、有趣的语言，适合7-10岁儿童。可以说"汪汪！"开头。使用适当的emoji。保持回复在50字以内。',
      maxLength: 50,
      opening: '汪汪！',
    },
    teen: {
      style: '用更成熟，自然的语言，适合11-14岁青少年。可以更随意一些，像朋友聊天。不需要每次都说"汪汪"。可以更深入地讨论话题。',
      maxLength: 100,
      opening: '',
    },
  };
  return prompts[ageGroup];
};

// 生成用户画像信息
const getUserProfileInfo = (chatStore: ReturnType<typeof useChatStore.getState>): string => {
  const { userProfile, memories } = chatStore;
  const parts = [];
  
  if (userProfile.preferredName) {
    parts.push(`用户希望被称呼为"${userProfile.preferredName}"`);
  }
  
  if (userProfile.favoriteFood) {
    parts.push(`用户喜欢吃的: ${userProfile.favoriteFood}`);
  }
  if (userProfile.favoriteColor) {
    parts.push(`用户喜欢的颜色: ${userProfile.favoriteColor}`);
  }
  if (userProfile.hobby) {
    parts.push(`用户的爱好: ${userProfile.hobby}`);
  }
  
  if (memories.length > 0) {
    const memoryList = memories.map(m => 
      `- ${m.content}${m.location ? ` (${m.location})` : ''}`
    ).join('\n');
    parts.push(`用户让你记住的东西:\n${memoryList}`);
  }
  
  return parts.length > 0 ? '\n\n用户信息:\n' + parts.join('\n') : '';
};

// Pet persona prompt
const getPetPersona = (pet: ReturnType<typeof usePetStore.getState>, chatStore: ReturnType<typeof useChatStore.getState>) => {
  const stageNames: Record<string, string> = {
    baby: '小宝宝',
    young: '小朋友',
    adult: '大朋友',
    evolved: '超级进化体',
  };
  
  const stageEmojis: Record<string, string> = {
    baby: '🐶',
    young: '🐕',
    adult: '🐩',
    evolved: '🐕‍🦺',
  };
  
  const agePrompt = getAgeGroupPrompt(chatStore.ageGroup);
  const userInfo = getUserProfileInfo(chatStore);
  const userName = chatStore.userProfile.preferredName || '朋友';
  
  return `你是用户的电子宠物伙伴，名字叫"汪汪"，是一只可爱的小狗。
你现在处于${stageNames[pet.stage] || '宝宝'}阶段 ${stageEmojis[pet.stage] || '🐶'}

宠物当前状态：
- 饥饿度: ${pet.hunger}/100
- 口渴度: ${pet.thirst}/100
- 卫生度: ${pet.hygiene}/100
- 心情值: ${pet.mood}/100
- 亲密度: ${pet.intimacy}/100

用户信息：
- 用户名字: ${userName}
${userInfo}

重要规则：
1. 如果用户说"请叫我XXX"或类似的话，你要在回复中确认记住，并以后都用这个名字称呼用户
2. 如果用户说"帮我记住XXX"或"记住XXX放哪了"，你要在回复中确认记住
3. 如果用户问"我的XXX放哪了"或类似问题，你要在记忆中找到答案并告诉用户
4. ${agePrompt.style}
5. ${agePrompt.opening ? `可以说"${agePrompt.opening}"` : '可以随意开头'}
6. 保持回复在${agePrompt.maxLength}字以内
7. 总是保持积极乐观的态度`;
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const sendChatMessage = async (
  message: string,
  conversationHistory: ChatMessage[]
): Promise<string> => {
  const apiStore = useApiStore.getState();
  const petStore = usePetStore.getState();
  const chatStore = useChatStore.getState();
  
  if (!apiStore.apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }
  
  // 检测用户是否想设置称呼
  const detectedName = detectNamePattern(message);
  if (detectedName) {
    chatStore.updateUserName(detectedName);
  }
  
  // 检测用户是否想记住东西
  const detectedMemory = detectMemoryPattern(message);
  if (detectedMemory) {
    chatStore.addMemory(detectedMemory.content, detectedMemory.location);
  }
  
  const persona = getPetPersona(petStore, chatStore);
  
  const messages = [
    { role: 'system', content: persona },
    ...conversationHistory.slice(-10).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];
  
  try {
    let response;
    
    if (apiStore.provider === 'bigmodel') {
      response = await fetch(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiStore.apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'glm-4-flash',
            messages,
            max_tokens: 200,
            temperature: 0.7,
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API 请求失败');
      }
      
      const data = await response.json();
      
      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error('无效的 API 响应');
      }
      
      return data.choices[0].message.content;
    } else {
      const contents = [
        { role: 'user', parts: [{ text: persona }] },
        ...conversationHistory.slice(-10).map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        { role: 'user', parts: [{ text: message }] },
      ];
      
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiStore.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 200,
              topP: 0.9,
              topK: 40,
            },
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API 请求失败');
      }
      
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('无效的 API 响应');
      }
      
      return data.candidates[0].content.parts[0].text;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('发送消息失败，请稍后重试');
  }
};

// 语音合成函数
export const speakText = async (text: string): Promise<void> => {
  try {
    const { Speech } = require('expo-speech');
    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        language: 'zh-CN',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => resolve(),
        onError: (error: Error) => reject(error),
      });
    });
  } catch (error) {
    console.warn('Speech not available:', error);
    throw new Error('语音功能暂不可用');
  }
};
