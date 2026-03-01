# 电子宠物 - 项目需求文档

## 1. 项目概述

- **项目名称**：PetPal - 儿童电子宠物
- **项目类型**：跨平台移动应用（Android/iOS/Web）
- **核心功能**：一款面向儿童的虚拟宠物养成游戏，孩子可以通过喂食、互动、照顾宠物，培养责任感和爱心
- **目标用户**：3-10岁儿童及其家长

## 2. 技术栈

| 类别 | 技术选型 |
|-----|---------|
| 框架 | React Native + Expo |
| 状态管理 | Zustand |
| 本地存储 | AsyncStorage |
| 动画 | React Native Reanimated + Skia |
| 音频 | expo-av |
| 手势 | React Native Gesture Handler |
| 平台 | Android / iOS / Web |

| 类别 | 技术选型 |
|-----|---------|
| 框架 | Flutter 3.x |
| 游戏引擎 | Flame |
| 状态管理 | Riverpod |
| 本地存储 | Hive |
| 动画 | Sprite Sheet + Lottie |
| 音频 | audioplayers |
| 平台 | Android / iOS / Web |

## 3. 功能清单

### 3.1 宠物养成系统

| 功能 | 描述 | 优先级 |
|-----|-----|-------|
| 宠物展示 | 主界面显示宠物形象和状态 | P0 |
| 喂食 | 点击食物图标喂食，增加饱食度 | P0 |
| 喂水 | 点击水杯图标喂水，增加水分值 | P0 |
| 洗澡 | 点击洗澡图标清洁，增加卫生值 | P0 |
| 抚摸 | 点击宠物触发互动，增加亲密度 | P0 |
| 状态显示 | 饥饿值、水分值、卫生值、心情值 | P0 |
| 成长阶段 | 幼年期→青年期→成年期→进化 | P1 |
| 进化系统 | 满足条件后进化为新形态 | P1 |

### 3.2 宠物状态系统

| 状态属性 | 范围 | 下降速率 | 恢复方式 |
|---------|-----|---------|---------|
| 饱食度 | 0-100 | 每小时-5 | 喂食+20 |
| 水分值 | 0-100 | 每小时-8 | 喂水+20 |
| 卫生值 | 0-100 | 每小时-3 | 洗澡+30 |
| 心情值 | 0-100 | 每小时-2 | 抚摸+10 |
| 亲密度 | 0-100 | 不下降 | 互动+5 |

### 3.3 宠物反应系统

| 状态阈值 | 宠物反应 |
|---------|---------|
| 状态值 > 80 | 开心动画 😄 |
| 状态值 50-80 | 正常动画 😐 |
| 状态值 20-50 | 担心动画 😟 |
| 状态值 < 20 | 危险动画 😢 |
| 任一状态 = 0 | 生病动画 🤒 |

### 3.4 成长系统

| 阶段 | 所需时间 | 解锁内容 |
|-----|---------|---------|
| 幼年期 | 0-3天 | 基础互动 |
| 青年期 | 3-7天 | 技能学习 |
| 成年期 | 7-14天 | 进化形态 |
| 进化体 | 14天+ | 特殊外观 |

### 3.5 交互功能

| 功能 | 描述 |
|-----|-----|
| 点击抚摸 | 点击宠物头部区域，播放抚摸动画 |
| 摇一摇 | 摇动设备，触发惊喜互动 |
| 对话 | 简单语音/文字互动反馈 |
| 小游戏 | 简单点击游戏，增加心情 |

### 3.6 设置功能

| 功能 | 描述 |
|-----|-----|
| 使用时间限制 | 每日使用时长提醒 |
| 家长锁 | 家长设置PIN码 |
| 主题切换 | 白天/夜晚模式 |
| 宠物重置 | 重新开始养成 |

## 4. UI/UX 设计

### 4.1 界面结构

```
┌─────────────────────────┐
│      顶部状态栏          │
│  [饱食][水分][卫生][心情] │
├─────────────────────────┤
│                         │
│                         │
│       宠物展示区        │
│                         │
│                         │
├─────────────────────────┤
│    [喂食][喂水][洗澡][抚摸]│
│         [小游戏][设置]     │
└─────────────────────────┘
```

### 4.2 视觉风格

- **整体风格**：温暖、可爱、低饱和度
- **主色调**：柔和的暖黄色 #FFE4B5
- **强调色**：温柔的粉色 #FFB6C1
- **字体**：圆润可爱的字体
- **图标**：简洁的扁平化图标

### 4.3 动画要求

| 动画类型 | 时长 | 帧率 |
|---------|-----|-----|
| 宠物待机 | 循环 | 8fps |
| 喂食动画 | 1s | 12fps |
| 抚摸动画 | 0.5s | 12fps |
| 状态变化 | 0.3s | 60fps |
| 进化动画 | 3s | 24fps |

## 5. 技术架构

### 5.1 项目结构

```
src/
├── App.tsx
├── components/
│   ├── Pet/
│   │   ├── PetSprite.tsx
│   │   ├── PetStatus.tsx
│   │   └── PetActions.tsx
│   └── UI/
│       ├── Button.tsx
│       ├── StatusBar.tsx
│       └── Menu.tsx
├── screens/
│   ├── HomeScreen.tsx
│   └── SettingsScreen.tsx
├── stores/
│   └── petStore.ts
├── services/
│   ├── storage.ts
│   └── audio.ts
├── constants/
│   └── theme.ts
└── types/
    └── pet.ts
```

### 5.2 核心类设计

```typescript
// Pet 状态类型
interface PetState {
  hunger: number;      // 饱食度 0-100
  thirst: number;     // 水分值 0-100
  hygiene: number;    // 卫生值 0-100
  mood: number;       // 心情值 0-100
  intimacy: number;   // 亲密度 0-100
  stage: 'baby' | 'young' | 'adult' | 'evolved';
  createdAt: number;
}

// Pet Store 方法
interface PetActions {
  feed: () => void;
  water: () => void;
  bathe: () => void;
  pet: () => void;
  evolve: () => void;
  tick: () => void;   // 每小时状态衰减
  reset: () => void;
}
```

### 5.1 项目结构

```
lib/
├── main.dart
├── app.dart
├── core/
│   ├── constants/
│   ├── theme/
│   └── utils/
├── data/
│   ├── models/
│   └── repositories/
├── game/
│   ├── components/
│   ├── pets/
│   └── systems/
├── ui/
│   ├── screens/
│   └── widgets/
└── services/
    ├── audio_service.dart
    └── storage_service.dart
```

### 5.2 核心类设计

```
Pet
├── 属性：hunger, thirst, hygiene, mood, intimacy
├── 状态：currentStage, evolutionForm
├── 方法：feed(), water(), bathe(), pet(), evolve()
└── 事件：onStateChanged, onStageChanged

PetGame (Flame Game)
├── 组件：PetSprite, FoodButton, WaterButton, etc.
├── 系统：StateSystem, GrowthSystem, AnimationSystem
└── 生命周期：onLoad, onUpdate, onTapDown
```

## 6. 素材需求

### 6.1 必需素材

- 宠物精灵图（Sprite Sheet）- 4个方向 × 3种状态
- 食物图标（3种）
- 喝水图标
- 洗澡图标
- 抚摸特效
- UI按钮图标
- 背景音乐
- 音效（喂食、抚摸、进化等）
### 6.2 素材来源

- **免费**：OpenGameArt, Kenney Assets
- **AI生成**：Midjourney, DALL·E
- **简化方案**：使用Emoji + 代码动画 + Lottie
### 6.2 素材来源

- **免费**：OpenGameArt, Kenney Assets
- **AI生成**：Midjourney, DALL·E
- **简化方案**：使用Emoji + 代码动画

## 7. 发布计划

### Phase 1 - MVP（2周）
- [ ] 核心养成功能
- [ ] 基础动画
- [ ] 本地存档

### Phase 2 - 完善（1周）
- [ ] 成长进化系统
- [ ] 音效
- [ ] UI优化

### Phase 3 - 发布（1周）
- [ ] Android打包
- [ ] iOS打包
- [ ] Web发布
