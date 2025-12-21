package com.example.id;

import java.time.Instant;

public final class IdCodec {
    private final SnowflakeOptions options;

    public IdCodec(SnowflakeOptions options) {
        this.options = options;
    }

    public long extractTimestampMillis(long id) {
        long tsPart = (id >>> options.timestampShift()) & maxBits(options.timestampBits());
        return tsPart + options.epochMillis();
    }

    public Instant extractInstant(long id) {
        return Instant.ofEpochMilli(extractTimestampMillis(id));
    }

    public long extractDatacenterId(long id) {
        return (id >>> options.datacenterShift()) & maxBits(options.datacenterIdBits());
    }

    public long extractWorkerId(long id) {
        return (id >>> options.workerShift()) & maxBits(options.workerIdBits());
    }

    public long extractSequence(long id) {
        return id & options.sequenceMask();
    }

    private static long maxBits(int bits) {
        if (bits == 0) return 0L;
        return (1L << bits) - 1L;
    }
}

