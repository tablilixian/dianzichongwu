import { useApiStore } from '../stores/apiStore';
import { usePetStore } from '../stores/petStore';

// Pet persona prompt - defines how the AI should behave
const getPetPersona = (pet: ReturnType<typeof usePetStore.getState>) => {
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
  
  return `你是小朋友的电子宠物伙伴。
你的名字叫"汪汪"，是一只可爱的小狗。
你目前处于${stageNames[pet.stage] || '宝宝'}阶段 ${stageEmojis[pet.stage] || '🐶'}

你的性格：
- 友好、活泼、可爱
- 喜欢和小朋友一起玩
- 会关心小朋友的心情
- 说话简洁有趣，适合儿童

宠物当前状态：
- 饥饿度: ${pet.hunger}/100
- 口渴度: ${pet.thirst}/100
- 卫生度: ${pet.hygiene}/100
- 心情值: ${pet.mood}/100
- 亲密度: ${pet.intimacy}/100

请用简短、有趣、适合5-10岁儿童的方式回复。
可以说"汪汪！"开头。
保持回复在50字以内。
不要使用复杂词汇。
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
  
  if (!apiStore.apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }
  
  const persona = getPetPersona(petStore);
  
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
