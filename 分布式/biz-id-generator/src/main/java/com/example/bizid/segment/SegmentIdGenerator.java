package com.example.bizid.segment;

import com.example.bizid.repo.IdAllocRepository;
import com.example.bizid.repo.Segment;

import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * 基于“号段缓存”模式发号：每个 bizTag 对应一个 SegmentBuffer。
 */
public final class SegmentIdGenerator {
    private final IdAllocRepository repository;
    private final int defaultStep;
    private final int prefetchThreshold;
    private final ExecutorService prefetchPool;
    private final ConcurrentMap<String, SegmentBuffer> buffers = new ConcurrentHashMap<>();

    private SegmentIdGenerator(Builder builder) {
        this.repository = Objects.requireNonNull(builder.repository, "repository");
        this.defaultStep = builder.defaultStep;
        this.prefetchThreshold = builder.prefetchThreshold;
        this.prefetchPool = Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "segment-prefetch");
            t.setDaemon(true);
            return t;
        });
        if (defaultStep <= 0) throw new IllegalArgumentException("defaultStep must be > 0");
        if (prefetchThreshold <= 0) throw new IllegalArgumentException("prefetchThreshold must be > 0");
    }

    public static Builder builder(IdAllocRepository repository) {
        return new Builder(repository);
    }

    public long nextId(String bizTag) {
        return nextId(bizTag, defaultStep);
    }

    public long nextId(String bizTag, int step) {
        Objects.requireNonNull(bizTag, "bizTag");
        if (step <= 0) throw new IllegalArgumentException("step must be > 0");
        SegmentBuffer buffer = buffers.computeIfAbsent(bizTag, k -> new SegmentBuffer(repository, k, step, prefetchThreshold, prefetchPool));
        return buffer.next();
    }

    public void shutdown() {
        prefetchPool.shutdown();
        try {
            prefetchPool.awaitTermination(3, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    public static final class Builder {
        private final IdAllocRepository repository;
        private int defaultStep = 1_000;
        private int prefetchThreshold = 100;

        private Builder(IdAllocRepository repository) {
            this.repository = repository;
        }

        public Builder defaultStep(int defaultStep) {
            this.defaultStep = defaultStep;
            return this;
        }

        /**
         * 当前号段剩余 <= threshold 时，预取下一号段。
         */
        public Builder prefetchThreshold(int prefetchThreshold) {
            this.prefetchThreshold = prefetchThreshold;
            return this;
        }

        public SegmentIdGenerator build() {
            return new SegmentIdGenerator(this);
        }
    }

    static long segmentStart(Segment segment) {
        return segment.startInclusive();
    }

    static long segmentEnd(Segment segment) {
        return segment.endInclusive();
    }
}

