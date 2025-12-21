package com.example.id;

import java.time.Instant;
import java.util.Objects;

public final class SnowflakeOptions {
    public static final long DEFAULT_EPOCH_MILLIS = Instant.parse("2024-01-01T00:00:00Z").toEpochMilli();

    private final long epochMillis;
    private final int timestampBits;
    private final int datacenterIdBits;
    private final int workerIdBits;
    private final int sequenceBits;
    private final long maxBackwardMs;

    private SnowflakeOptions(Builder builder) {
        this.epochMillis = builder.epochMillis;
        this.timestampBits = builder.timestampBits;
        this.datacenterIdBits = builder.datacenterIdBits;
        this.workerIdBits = builder.workerIdBits;
        this.sequenceBits = builder.sequenceBits;
        this.maxBackwardMs = builder.maxBackwardMs;
        validate();
    }

    public static Builder builder() {
        return new Builder();
    }

    public long epochMillis() {
        return epochMillis;
    }

    public int timestampBits() {
        return timestampBits;
    }

    public int datacenterIdBits() {
        return datacenterIdBits;
    }

    public int workerIdBits() {
        return workerIdBits;
    }

    public int sequenceBits() {
        return sequenceBits;
    }

    public long maxBackwardMs() {
        return maxBackwardMs;
    }

    public long maxDatacenterId() {
        return maxIdOfBits(datacenterIdBits);
    }

    public long maxWorkerId() {
        return maxIdOfBits(workerIdBits);
    }

    public long maxSequence() {
        return maxIdOfBits(sequenceBits);
    }

    public int workerShift() {
        return sequenceBits;
    }

    public int datacenterShift() {
        return sequenceBits + workerIdBits;
    }

    public int timestampShift() {
        return sequenceBits + workerIdBits + datacenterIdBits;
    }

    public long timestampMask() {
        return maxIdOfBits(timestampBits) << timestampShift();
    }

    public long datacenterMask() {
        return maxIdOfBits(datacenterIdBits) << datacenterShift();
    }

    public long workerMask() {
        return maxIdOfBits(workerIdBits) << workerShift();
    }

    public long sequenceMask() {
        return maxIdOfBits(sequenceBits);
    }

    public void validateWorkerId(WorkerId workerId) {
        Objects.requireNonNull(workerId, "workerId");
        if (workerId.datacenterId() < 0 || workerId.datacenterId() > maxDatacenterId()) {
            throw new IllegalArgumentException("datacenterId out of range: " + workerId.datacenterId());
        }
        if (workerId.workerId() < 0 || workerId.workerId() > maxWorkerId()) {
            throw new IllegalArgumentException("workerId out of range: " + workerId.workerId());
        }
    }

    private void validate() {
        if (epochMillis < 0) {
            throw new IllegalArgumentException("epochMillis must be >= 0");
        }
        if (timestampBits <= 0 || datacenterIdBits < 0 || workerIdBits < 0 || sequenceBits <= 0) {
            throw new IllegalArgumentException("bit size invalid");
        }
        if (timestampBits + datacenterIdBits + workerIdBits + sequenceBits != 63) {
            throw new IllegalArgumentException("total bits must be 63");
        }
        if (maxBackwardMs < 0) {
            throw new IllegalArgumentException("maxBackwardMs must be >= 0");
        }
    }

    private static long maxIdOfBits(int bits) {
        if (bits == 0) return 0L;
        return (1L << bits) - 1L;
    }

    public static final class Builder {
        private long epochMillis = DEFAULT_EPOCH_MILLIS;
        private int timestampBits = 41;
        private int datacenterIdBits = 5;
        private int workerIdBits = 5;
        private int sequenceBits = 12;
        private long maxBackwardMs = 10L;

        private Builder() {
        }

        public Builder epochMillis(long epochMillis) {
            this.epochMillis = epochMillis;
            return this;
        }

        public Builder bits(int timestampBits, int datacenterIdBits, int workerIdBits, int sequenceBits) {
            this.timestampBits = timestampBits;
            this.datacenterIdBits = datacenterIdBits;
            this.workerIdBits = workerIdBits;
            this.sequenceBits = sequenceBits;
            return this;
        }

        public Builder maxBackwardMs(long maxBackwardMs) {
            this.maxBackwardMs = maxBackwardMs;
            return this;
        }

        public SnowflakeOptions build() {
            return new SnowflakeOptions(this);
        }
    }
}

