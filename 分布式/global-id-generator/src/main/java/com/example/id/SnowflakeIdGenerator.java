package com.example.id;

import java.util.Objects;
import java.util.concurrent.locks.LockSupport;

public final class SnowflakeIdGenerator implements IdGenerator {
    private final SnowflakeOptions options;
    private final TimeSource timeSource;
    private final WorkerId workerId;

    private long lastTimestamp = -1L;
    private long sequence = 0L;

    public SnowflakeIdGenerator(SnowflakeOptions options, WorkerIdAssigner assigner) {
        this(options, assigner, SystemTimeSource.INSTANCE);
    }

    public SnowflakeIdGenerator(SnowflakeOptions options, WorkerIdAssigner assigner, TimeSource timeSource) {
        this.options = Objects.requireNonNull(options, "options");
        this.timeSource = Objects.requireNonNull(timeSource, "timeSource");
        Objects.requireNonNull(assigner, "assigner");
        this.workerId = assigner.assign(options);
        this.options.validateWorkerId(workerId);
    }

    public WorkerId getWorkerId() {
        return workerId;
    }

    public SnowflakeOptions getOptions() {
        return options;
    }

    public String nextIdAsBase62() {
        return Base62.encodeUnsigned(nextId());
    }

    @Override
    public synchronized long nextId() {
        long now = timeSource.currentTimeMillis();
        if (now < options.epochMillis()) {
            throw new IllegalStateException("Current time is before epochMillis. now=" + now + ", epoch=" + options.epochMillis());
        }

        if (now < lastTimestamp) {
            long delta = lastTimestamp - now;
            if (delta <= options.maxBackwardMs()) {
                now = waitUntil(lastTimestamp);
            } else {
                throw new ClockMovedBackwardsException(lastTimestamp, now);
            }
        }

        if (now == lastTimestamp) {
            sequence = (sequence + 1) & options.maxSequence();
            if (sequence == 0) {
                now = waitUntil(lastTimestamp + 1);
            }
        } else {
            sequence = 0;
        }

        lastTimestamp = now;
        long timestampPart = (now - options.epochMillis()) << options.timestampShift();
        long datacenterPart = workerId.datacenterId() << options.datacenterShift();
        long workerPart = workerId.workerId() << options.workerShift();
        return timestampPart | datacenterPart | workerPart | sequence;
    }

    private long waitUntil(long targetMillis) {
        long now = timeSource.currentTimeMillis();
        while (now < targetMillis) {
            LockSupport.parkNanos(100_000L);
            now = timeSource.currentTimeMillis();
        }
        return now;
    }
}
