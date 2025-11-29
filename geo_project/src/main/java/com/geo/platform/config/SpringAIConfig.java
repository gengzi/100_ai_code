package com.geo.platform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SpringAIConfig {

    private static final Logger logger = LoggerFactory.getLogger(SpringAIConfig.class);

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    @Value("${spring.ai.openai.base-url:https://api.openai.com}")
    private String baseUrl;

    @Value("${spring.ai.openai.chat.options.model:deepseek-ai/DeepSeek-V3}")
    private String model;

    @Value("${spring.ai.openai.chat.options.temperature:0.7}")
    private Double temperature;

    @Value("${spring.ai.openai.chat.options.max-tokens:4000}")
    private Integer maxTokens;

    @Bean
    public OpenAiApi openAiApi() {
        logger.info("初始化OpenAiApi - baseUrl: {}, model: {}", baseUrl, model);

        return new OpenAiApi(baseUrl, apiKey);
    }

    @Bean
    public OpenAiChatModel openAiChatModel(OpenAiApi openAiApi) {
        logger.info("初始化OpenAiChatModel - model: {}, temperature: {}, maxTokens: {}",
                   model, temperature, maxTokens);

        return new OpenAiChatModel(openAiApi,
            org.springframework.ai.openai.OpenAiChatOptions.builder()
                .withModel(model)
                .withTemperature(temperature != null ? temperature.floatValue() : 0.7f)
                .withMaxTokens(maxTokens != null ? maxTokens : 4000)
                .build());
    }
}