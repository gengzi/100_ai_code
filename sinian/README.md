# 思念AI (Nostalgia AI)

> 基于大模型的AI思念人克隆系统，让爱永不消逝

## 项目简介

思念AI是一个温馨的AI克隆系统，允许用户创建思念人的数字克隆体。通过上传照片、语音样本和描述个性特征，AI大模型将学习并重现这个人的说话方式，与用户进行温暖、真实的对话。

### 核心功能

- 👤 **思念人管理**：创建和管理思念人档案
- 📸 **照片上传**：上传思念人的照片
- 🎙️ **语音样本**：上传语音文件，让AI更真实地还原
- 💬 **智能对话**：基于大模型的自然对话，重现思念人的个性
- 📝 **个性定制**：详细描述个性特征和记忆，AI将基于这些信息对话
- 🎨 **温馨界面**：温馨可爱的粉色主题设计

## 技术栈

### 后端
- **Spring Boot 3.2** - Java后端框架
- **Spring Data JPA** - 数据持久化
- **H2 Database** - 内存数据库（MVP阶段）
- **Spring AI** - 大模型集成
- **OpenAI API** - GPT-4模型

### 前端
- **Next.js 14** - React框架
- **TypeScript** - 类型安全
- **TailwindCSS** - 样式框架
- **Lucide Icons** - 图标库

## 快速开始

### 前置要求

- Java 17+
- Node.js 18+
- Maven 3.6+
- OpenAI API Key

### 后端启动

1. 进入后端目录：
```bash
cd backend
```

2. 配置OpenAI API Key：
编辑 `src/main/resources/application.yml`，替换 `your-api-key-here` 为你的实际API Key

3. 启动应用：
```bash
mvn spring-boot:run
```

后端将在 `http://localhost:8080` 启动

### 前端启动

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

前端将在 `http://localhost:3000` 启动

## 使用指南

### 创建思念人

1. 点击首页的"创建思念人"按钮
2. 上传思念人的照片（可选）
3. 填写姓名、关系等基本信息
4. 描述个性特征和记忆（重要！这将帮助AI更好地还原）
5. 上传语音样本（可选）
6. 点击"创建AI克隆体"

### 开始对话

1. 在首页选择一个思念人
2. 进入聊天界面
3. 发送消息，AI将以思念人的个性回应你

## 项目结构

```
sinian/
├── backend/                 # Spring Boot后端
│   ├── src/
│   │   └── main/
│   │       ├── java/com/sinian/nostalgia/
│   │       │   ├── entity/          # 实体类
│   │       │   ├── repository/      # 数据访问层
│   │       │   ├── service/         # 业务逻辑层
│   │       │   ├── controller/      # 控制器
│   │       │   ├── dto/             # 数据传输对象
│   │       │   └── config/          # 配置类
│   │       └── resources/
│   │           └── application.yml  # 配置文件
│   └── pom.xml
├── frontend/                # Next.js前端
│   ├── src/
│   │   ├── app/             # 页面路由
│   │   ├── components/      # 组件
│   │   ├── lib/             # 工具函数
│   │   └── types/           # TypeScript类型
│   ├── package.json
│   └── tailwind.config.ts
└── docs/                    # 文档
```

## API文档

### 思念人相关

- `GET /api/persons` - 获取所有思念人
- `GET /api/persons/{id}` - 获取指定思念人
- `POST /api/persons` - 创建思念人
- `PUT /api/persons/{id}` - 更新思念人
- `DELETE /api/persons/{id}` - 删除思念人
- `POST /api/persons/{id}/photo` - 上传照片
- `POST /api/persons/{id}/voice` - 上传语音

### 聊天相关

- `POST /api/chat` - 发送消息

## 配置说明

### OpenAI配置

在 `backend/src/main/resources/application.yml` 中配置：

```yaml
spring:
  ai:
    openai:
      api-key: your-actual-api-key
      chat:
        options:
          model: gpt-4
          temperature: 0.7
```

### 文件存储

默认上传目录：`~/nostalgia-uploads`

可在配置文件中修改：

```yaml
file:
  upload-dir: /your/custom/path
```

## 后续规划

- [ ] 支持更多大模型（Claude、文心一言等）
- [ ] 实现语音合成（TTS）
- [ ] 实现语音识别（STT）
- [ ] 添加对话历史管理
- [ ] 支持视频上传
- [ ] 多用户系统
- [ ] 数据库迁移到PostgreSQL
- [ ] Docker部署

## 许可证

MIT License

## 致谢

感谢所有为这个项目做出贡献的人。

---

💗 **思念AI - 让温暖的回忆永久延续**
