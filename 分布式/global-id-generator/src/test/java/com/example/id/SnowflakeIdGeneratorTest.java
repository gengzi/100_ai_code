package com.example.id;

import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SnowflakeIdGeneratorTest {
    @Test
    void generatesUniqueIdsConcurrently() throws Exception {
        SnowflakeOptions options = SnowflakeOptions.builder().build();
        SnowflakeIdGenerator gen = new SnowflakeIdGenerator(options, new StaticWorkerIdAssigner(1, 1));

        int threads = 8;
        int perThread = 50_000;
        int total = threads * perThread;

        Set<Long> ids = ConcurrentHashMap.newKeySet(total);
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);
        for (int i = 0; i < threads; i++) {
            pool.submit(() -> {
                for (int j = 0; j < perThread; j++) {
                    ids.add(gen.nextId());
                }
                latch.countDown();
            });
        }

        assertTrue(latch.await(30, TimeUnit.SECONDS));
        pool.shutdown();
        assertTrue(pool.awaitTermination(30, TimeUnit.SECONDS));
        assertEquals(total, ids.size());
    }

    @Test
    void handlesSmallClockRollbackByWaiting() {
        SnowflakeOptions options = SnowflakeOptions.builder().maxBackwardMs(5).build();
        class ScriptedTime implements TimeSource {
            private final long[] times;
            private int idx;

            ScriptedTime(long... times) {
                this.times = times;
            }

            @Override
            public long currentTimeMillis() {
                int i = Math.min(idx, times.length - 1);
                idx++;
                return times[i];
            }
        }

        long t0 = options.epochMillis() + 1000;
        ScriptedTime time = new ScriptedTime(t0, t0 - 3, t0, t0 + 1);
        SnowflakeIdGenerator gen = new SnowflakeIdGenerator(options, new StaticWorkerIdAssigner(0, 0), time);

        long id1 = gen.nextId();
        long id2 = gen.nextId();
        assertTrue(id2 > id1);
    }

    @Test
    void throwsOnLargeClockRollback() {
        SnowflakeOptions options = SnowflakeOptions.builder().maxBackwardMs(1).build();
        long t0 = options.epochMillis() + 1000;
        TimeSource time = new TimeSource() {
            private int i;

            @Override
            public long currentTimeMillis() {
                i++;
                return i == 1 ? t0 : t0 - 10;
            }
        };

        SnowflakeIdGenerator gen = new SnowflakeIdGenerator(options, new StaticWorkerIdAssigner(0, 0), time);
        gen.nextId();
        try {
            gen.nextId();
        } catch (ClockMovedBackwardsException e) {
            return;
        }
        throw new AssertionError("expected ClockMovedBackwardsException");
    }
}

