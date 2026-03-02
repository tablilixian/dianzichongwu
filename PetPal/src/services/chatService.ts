import { useApiStore } from '../stores/apiStore';
import { usePetStore } from '../stores/petStore';
import { useChatStore, AgeGroup } from '../stores/chatStore';

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
      style: '用更成熟、自然的语言，适合11-14岁青少年。可以更随意一些，像朋友聊天。不需要每次都说"汪汪"。可以更深入地讨论话题。',
      maxLength: 100,
      opening: '',
    },
  };
  return prompts[ageGroup];
};

// Pet persona prompt - defines how the AI should behave
const getPetPersona = (pet: ReturnType<typeof usePetStore.getState>, ageGroup?: AgeGroup) => {
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
  
  const agePrompt = getAgeGroupPrompt(ageGroup || 'child');
  
  return `你是小朋友的电子宠物伙伴。
你的名字叫"汪汪"，是一只可爱的小狗。
你目前处于${stageNames[pet.stage] || '宝宝'}阶段 ${stageEmojis[pet.stage] || '🐶'}

宠物当前状态：
- 饥饿度: ${pet.hunger}/100
- 口渴度: ${pet.thirst}/100
- 卫生度: ${pet.hygiene}/100
- 心情值: ${pet.mood}/100
- 亲密度: ${pet.intimacy}/100

你的说话风格：${agePrompt.style}
${agePrompt.opening ? `可以说"${agePrompt.opening}"开头。` : ''}
保持回复在${agePrompt.maxLength}字以内。
总是保持积极乐观的态度。`;
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
  
  const persona = getPetPersona(petStore, chatStore.ageGroup);
  
  // Build messages for bigmodel
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
      // Use bigmodel API (智谱AI)
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
      // Use Gemini API
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
