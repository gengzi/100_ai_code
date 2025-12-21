package com.example.bizid.segment;

import com.example.bizid.repo.IdAllocRepository;
import com.example.bizid.repo.Segment;

import java.util.Objects;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;

final class SegmentBuffer {
    private final IdAllocRepository repository;
    private final String bizTag;
    private final int step;
    private final int prefetchThreshold;
    private final ExecutorService prefetchPool;

    private volatile Range current;
    private volatile Range next;
    private final AtomicBoolean nextLoading = new AtomicBoolean(false);
    private final ReentrantLock refillLock = new ReentrantLock();

    SegmentBuffer(IdAllocRepository repository, String bizTag, int step, int prefetchThreshold, ExecutorService prefetchPool) {
        this.repository = Objects.requireNonNull(repository, "repository");
        this.bizTag = Objects.requireNonNull(bizTag, "bizTag");
        this.step = step;
        this.prefetchThreshold = prefetchThreshold;
        this.prefetchPool = Objects.requireNonNull(prefetchPool, "prefetchPool");
    }

    long next() {
        Range c = ensureCurrent();

        long v = c.next();
        if (v > 0) {
            maybePrefetch(c);
            return v;
        }

        // exhausted: swap to next (blocking if necessary)
        refillLock.lock();
        try {
            c = ensureCurrent();
            v = c.next();
            if (v > 0) {
                maybePrefetch(c);
                return v;
            }

            if (next == null) {
                next = loadNewRange();
            }
            current = next;
            next = null;
            nextLoading.set(false);

            long out = current.next();
            if (out <= 0) {
                throw new IllegalStateException("segment swap failed. bizTag=" + bizTag);
            }
            maybePrefetch(current);
            return out;
        } finally {
            refillLock.unlock();
        }
    }

    private Range ensureCurrent() {
        Range c = current;
        if (c != null) {
            return c;
        }
        refillLock.lock();
        try {
            if (current == null) {
                current = loadNewRange();
            }
            return current;
        } finally {
            refillLock.unlock();
        }
    }

    private void maybePrefetch(Range c) {
        if (c.remaining() > prefetchThreshold) {
            return;
        }
        if (next != null) {
            return;
        }
        if (!nextLoading.compareAndSet(false, true)) {
            return;
        }
        prefetchPool.submit(() -> {
            try {
                if (next == null) {
                    next = loadNewRange();
                }
            } finally {
                // keep nextLoading true until swap; if load failed it will be reset on swap path
            }
        });
    }

    private Range loadNewRange() {
        Segment segment = repository.allocateSegment(bizTag, step);
        return new Range(SegmentIdGenerator.segmentStart(segment), SegmentIdGenerator.segmentEnd(segment));
    }

    static final class Range {
        private final long endInclusive;
        private final AtomicLong value;

        Range(long startInclusive, long endInclusive) {
            if (startInclusive <= 0) throw new IllegalArgumentException("startInclusive must be > 0");
            if (endInclusive < startInclusive) throw new IllegalArgumentException("endInclusive must be >= startInclusive");
            this.endInclusive = endInclusive;
            this.value = new AtomicLong(startInclusive);
        }

        long next() {
            long v = value.getAndIncrement();
            return v <= endInclusive ? v : -1L;
        }

        long remaining() {
            long v = value.get();
            return Math.max(0, endInclusive - v + 1);
        }
    }
}

