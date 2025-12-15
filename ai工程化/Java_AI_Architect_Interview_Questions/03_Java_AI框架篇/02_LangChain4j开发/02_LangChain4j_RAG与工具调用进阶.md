# LangChain4j RAG与工具调用进阶
## 题目描述
在 Java 环境下基于 LangChain4j 设计一条可落地的 RAG + 工具调用链路，要求支持 Hybrid 检索、MMR 去冗余、重排、带引用回答，以及安全与观测。

## 答案要点
- 组件：PromptTemplate + EmbeddingStoreRetriever（Milvus/PGVector/本地 HNSW）+ RetrievalAugmentor + Tool 调用
- 检索：Hybrid（BM25 + 向量）并重排；MMR 去冗余；Top-K 控制 20–50，重排后取 5–8 条
- 工具：@Tool 暴露函数；参数校验、超时、失败回退；敏感操作加鉴权
- 生成：回答需引用来源；限制上下文长度；防越狱、安全过滤
- 缓存与观测：Embedding Cache、检索结果 Cache、工具成功率/延迟/P99、重排得分分布

## 核心原理
- RAG = 检索召回 + 重排 + 生成，召回质量决定上限，重排提升精度
- 工具调用让 LLM 具备“查/算/控”能力，需可观测与回退，避免阻塞主链路

## 架构流程
1) 查询改写：同义词扩展/拼写纠错（可选）
2) Hybrid 检索：BM25 + 向量；MMR 去冗余；业务过滤（租户/标签/语言）
3) 重排：Cross-Encoder / reranker 对 Top-K 打分，取高阈值前 N
4) 生成：模板化 Prompt，附带引用标注；超长截断；安全过滤
5) 工具：按意图选择工具；设置超时/熔断；失败回退（降级回答）
6) 观测：检索/重排/生成延迟拆解，命中率，工具成功率，错误与降级次数

## 核心代码示例（节选）
```java
import dev.langchain4j.chain.ChatChain;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.retriever.EmbeddingStoreRetriever;
import dev.langchain4j.rag.RetrievalAugmentor;
import dev.langchain4j.service.Tool;
import dev.langchain4j.service.ToolParam;

@ApplicationScoped
public class RagAssistant {

    private final ChatChain chain;

    public RagAssistant(EmbeddingStoreRetriever retriever, Reranker reranker, String apiKey) {
        RetrievalAugmentor augmentor = RetrievalAugmentor.builder()
            .retriever(retriever)
            .mmr(true)                // 多样性去冗余
            .reranker(reranker)       // 二阶段重排
            .maxResults(40)           // 检索 Top-K
            .build();

        ChatLanguageModel llm = OpenAiChatModel.builder()
            .apiKey(apiKey)
            .modelName("gpt-4o-mini")
            .temperature(0.2)
            .build();

        this.chain = ChatChain.builder()
            .llm(llm)
            .retrievalAugmentor(augmentor)
            .tools(List.of(this::getUserProfile, this::searchOrder))
            .promptTemplate("""
                你是 Java AI 助理。使用检索到的资料回答，并在末尾给出引用编号。
                问题: {{question}}
            """)
            .build();
    }

    @Tool("get_user_profile")
    public UserProfile getUserProfile(@ToolParam("userId") String userId) {
        return userService.load(userId);
    }

    @Tool("search_order")
    public OrderInfo searchOrder(@ToolParam("orderId") String orderId) {
        return orderService.find(orderId);
    }

    public String answer(String question) {
        return chain.execute(Map.of("question", question));
    }
}
```
> 生产化需补充：工具超时/熔断、结果缓存、引用格式化、敏感词/越狱过滤、日志与指标（成功率/延迟/P99）。

## 测试与验收
- 单测：工具参数校验、超时回退、检索/重排阈值过滤
- 集成：端到端问答，验证引用正确、工具调用成功率、MMR 去冗余效果
- 观测：记录检索命中率、重排前后得分分布、工具错误与降级次数
