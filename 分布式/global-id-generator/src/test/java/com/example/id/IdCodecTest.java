package com.example.id;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;

class IdCodecTest {
    @Test
    void canDecodeParts() {
        SnowflakeOptions options = SnowflakeOptions.builder().build();
        long now = options.epochMillis() + 12_345L;
        SnowflakeIdGenerator gen = new SnowflakeIdGenerator(options, new StaticWorkerIdAssigner(3, 7), () -> now);
        long id = gen.nextId();

        IdCodec codec = new IdCodec(options);
        assertEquals(3L, codec.extractDatacenterId(id));
        assertEquals(7L, codec.extractWorkerId(id));
        assertEquals(0L, codec.extractSequence(id));
        assertEquals(Instant.ofEpochMilli(now), codec.extractInstant(id));
    }
}
