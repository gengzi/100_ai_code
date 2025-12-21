package com.example.id;

import java.time.Instant;

public final class ExampleMain {
    public static void main(String[] args) {
        SnowflakeOptions options = SnowflakeOptions.builder().build();

        WorkerIdAssigner assigner = new MachineBasedWorkerIdAssigner();
        SnowflakeIdGenerator generator = new SnowflakeIdGenerator(options, assigner);

        long id = generator.nextId();
        String base62 = generator.nextIdAsBase62();

        IdCodec codec = new IdCodec(options);
        Instant ts = codec.extractInstant(id);

        System.out.println("workerId=" + generator.getWorkerId());
        System.out.println("id(long)=" + id);
        System.out.println("id(base62)=" + base62);
        System.out.println("timestamp=" + ts);
        System.out.println("datacenterId=" + codec.extractDatacenterId(id));
        System.out.println("workerId=" + codec.extractWorkerId(id));
        System.out.println("sequence=" + codec.extractSequence(id));
    }
}

