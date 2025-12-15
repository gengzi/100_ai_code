# RAG架构与向量数据库实践
## 题目描述
设计一套面向生产的 RAG（Retrieval-Augmented Generation）方案，涵盖数据入库、向量检索、重排、生成、安全与可观测性。给出向量库选型对比，并提供 Java + Spring Boot 的落地示例。

## 答案要点
- 流程：数据清洗/分块 → 向量化 → 索引 → 检索 → 重排 → 生成 → 反馈闭环
- 分块：按语义/标题保持上下文；重叠 10–20%；去重、归一化、敏感信息脱敏
- 向量库选型：Milvus（高并发/亿级）、PGVector（低门槛/交易一致性）、Pinecone（托管）、Elasticsearch/KNN（检索一体）
- 检索策略：Hybrid（BM25+向量）、Top-K + MMR、业务过滤（标签/租户/语言），必要时二阶段重排（Cross-Encoder/Reranker）
- 生成策略：限制上下文长度、指令防越狱、安全过滤（PII/合规），对答生成加引用
- 缓存：Embedding Cache（LRU/TTL）、查询结果 Cache、生成 Cache（按 prompt+检索结果）
- 可观测性：检索命中率、Top-K 召回得分、重排得分、延迟分解（向量检索/重排/生成）、失败/超时/降级计数
- 反馈&迭代：人工标注对/负样本、向量回灌、基于日志的自动重训；定期评测集（MTEB/自建）回归

## 核心原理
- RAG = 检索（相关文档）+ 生成（基于上下文回答），以降低幻觉、提升时效性与可控性
- 召回质量决定上限：分块策略、embedding 质量、索引类型、过滤条件
- 重排提升精度：Cross-Encoder 或语义 rerank，对 Top-K 做二阶段打分

## 架构设计
1) 数据层：原始文档存储（对象存储/DB），Metadata（业务标签、版本、语言、租户）
2) 处理层：清洗 → 分块（标题/层级）→ 去重 → 脱敏 → Embedding → 写向量库
3) 索引层：向量库/混合检索；支持分区/租户隔离、HNSW/IVF 索引
4) 检索层：查询改写/扩展 → Hybrid 检索 → Top-K → 重排 → 去重/合并
5) 生成层：模板化 Prompt，限制 token，添加来源引用；安全过滤
6) 观测层：日志 + 指标（命中率/延迟/错误）+ 质检（人工/自动评测）
7) 反馈层：正负样本收集、硬负样本挖掘、定期重训与评测

## 向量库选型对比
- Milvus：亿级向量，高并发，高级索引（HNSW/IVF/SCANN），需维护集群，适合大规模
- PGVector：PostgreSQL 扩展，事务一致性强，门槛低，单库容量/并发有限
- Pinecone：托管，弹性扩容，免运维，需付费和网络依赖
- Elasticsearch/KNN：检索一体，易集成，向量索引/性能弱于专用库

## 索引与参数建议
- 度量：余弦/内积常用；欧氏距离次之
- 索引：中小规模可用 HNSW；大规模可用 IVF_FLAT/IVF_PQ；重排前 Top-K 适度（一般 20–50）
- 参数：HNSW(M=16–32, efConstruction=200–400, efSearch=100–200)；IVF(nlist 128–1024 视数据量)

## 检索与重排
- Hybrid：BM25 召回业务关键词 + 向量召回语义；分配权重或并集再重排
- MMR 去冗余：λ 控制多样性；防止相似块挤占上下文
- 重排：Cross-Encoder（如 bge-reranker）对 Top-K 重新打分；只保留高阈值前 N 条

## 安全与合规
- 脱敏：PII/敏感字段在入库前清洗；存 Metadata 的合规标签
- 访问控制：按租户/角色过滤；签名/审计日志
- 输出安全：生成前后敏感词/越狱过滤；上下文长度限制；禁止返回原始密级内容

## 缓存策略
- Embedding Cache：相同文本向量复用；hash(text) 为 key；TTL 结合业务
- Query Cache：同查询 Top-K 结果；带租户/语言/过滤条件
- Generation Cache：prompt + 检索结果 hash；注意隐私数据不要缓存

## 可观测性指标
- 召回：hit@k、mAP、重排前/后得分分布
- 质量：人工标注集准确率、BLEU/ROUGE（适度参考）、回答是否带引用
- 性能：P99/P95 延迟拆解（检索/重排/生成）、QPS、错误率、降级次数
- 数据：分块大小分布、索引构建耗时、向量库 load/compaction 状态

## Java + Spring Boot 示例（Milvus + OpenAI Embedding）
```java
// build.gradle 主要依赖：
// implementation 'io.milvus:milvus-sdk-java:2.4.3'
// implementation 'com.theokanning.openai-gpt3-java:service:0.18.2'

// 简化的向量入库与检索服务
@Service
public class RagVectorService {
    private final MilvusServiceClient milvus;
    private final OpenAiService openai;
    private final String collection = "docs";

    public RagVectorService(@Value("${milvus.uri}") String uri,
                            @Value("${openai.key}") String apiKey) {
        this.milvus = new MilvusServiceClient(ConnectParam.newBuilder().withUri(uri).build());
        this.openai = new OpenAiService(apiKey);
    }

    // 向量化并写入
    public void upsert(String id, String text, Map<String, Object> meta) {
        List<Double> vector = embed(text);
        List<InsertParam.Field> fields = List.of(
            new InsertParam.Field("id", List.of(id)),
            new InsertParam.Field("vector", List.of(vector)),
            new InsertParam.Field("text", List.of(text)),
            new InsertParam.Field("meta", List.of(JsonUtils.toJson(meta)))
        );
        milvus.insert(InsertParam.newBuilder().withCollectionName(collection).withFields(fields).build());
    }

    // 检索 Top-K
    public List<SearchResult> search(String query, int topK, double scoreThreshold) {
        List<Double> vector = embed(query);
        SearchParam param = SearchParam.newBuilder()
            .withCollectionName(collection)
            .withTopK(topK)
            .withVectors(List.of(vector))
            .withMetricType(MetricType.IP) // 内积
            .withOutFields(List.of("text", "meta"))
            .build();
        R<SearchResults> resp = milvus.search(param);
        return resp.getData().getResults()
            .getFieldsDataList().stream()
            .map(SearchResult::fromFieldData)
            .filter(r -> r.getScore() >= scoreThreshold)
            .toList();
    }

    // 调用 OpenAI Embedding
    private List<Double> embed(String text) {
        EmbeddingRequest req = EmbeddingRequest.builder()
            .model("text-embedding-3-small")
            .input(List.of(text))
            .build();
        return openai.createEmbeddings(req).getData().get(0).getEmbedding();
    }
}
```
> 建议：结合 Controller/Service 补充查询改写、重排（可用外部 reranker 服务）与生成阶段；生成时拼接引用并限制上下文长度。

## 验收与测试
- 单测：分块/去重/脱敏、向量入库/检索 Top-K、阈值过滤、缓存命中
- 集成测试：端到端问答，验证引用正确性与越狱/敏感词过滤
- 评测集：构造 50–200 条标注问答，定期跑 hit@k、准确率，监控回归
