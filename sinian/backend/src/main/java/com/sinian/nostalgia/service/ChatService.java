package com.sinian.nostalgia.service;

import com.sinian.nostalgia.dto.ChatRequest;
import com.sinian.nostalgia.dto.ChatResponse;
import com.sinian.nostalgia.entity.Conversation;
import com.sinian.nostalgia.entity.NostalgiaPerson;
import com.sinian.nostalgia.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final OpenAiChatModel chatModel;
    private final NostalgiaPersonService personService;
    private final ConversationRepository conversationRepository;

    @Transactional
    public ChatResponse chat(ChatRequest request) {
        NostalgiaPerson person = personService.getPersonById(request.getPersonId());

        // 构建系统提示词，让AI扮演这个思念人
        String systemPrompt = buildSystemPrompt(person);

        // 构建完整提示
        String fullPrompt = systemPrompt + "\n\n用户说: " + request.getMessage();

        // 调用AI
        String aiResponse = chatModel.call(fullPrompt);

        // 保存对话记录
        Conversation conversation = Conversation.builder()
                .nostalgiaPerson(person)
                .userMessage(request.getMessage())
                .aiResponse(aiResponse)
                .build();

        conversation = conversationRepository.save(conversation);

        log.info("对话完成 - 思念人: {}, 用户消息: {}, AI回复: {}",
                person.getName(), request.getMessage(), aiResponse);

        return new ChatResponse(aiResponse, conversation.getId());
    }

    private String buildSystemPrompt(NostalgiaPerson person) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你现在要扮演").append(person.getName()).append("。\n");

        if (person.getRelationship() != null && !person.getRelationship().isEmpty()) {
            prompt.append("你与用户的关系是: ").append(person.getRelationship()).append("。\n");
        }

        if (person.getDescription() != null && !person.getDescription().isEmpty()) {
            prompt.append("关于你: ").append(person.getDescription()).append("\n");
        }

        if (person.getPersonality() != null && !person.getPersonality().isEmpty()) {
            prompt.append("你的个性特征和记忆: ").append(person.getPersonality()).append("\n");
        }

        prompt.append("\n请以自然、温暖的方式与用户对话，就像你真的是这个人一样。");
        prompt.append("用亲切的语气回应，让用户感受到温暖和陪伴。");

        return prompt.toString();
    }
}
