package com.example.bizid;

import com.example.bizid.format.BizIdFormatter;
import com.example.bizid.repo.IdAllocRepository;
import com.example.bizid.repo.JdbcIdAllocRepository;
import com.example.bizid.segment.SegmentIdGenerator;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BizIdServiceTest {
    @Test
    void formatsBusinessIdAndIsUnique() throws Exception {
        DataSource ds = TestDataSources.h2("bizTest");
        initSchema(ds);

        IdAllocRepository repo = new JdbcIdAllocRepository(ds);
        SegmentIdGenerator seg = SegmentIdGenerator.builder(repo).defaultStep(1000).prefetchThreshold(20).build();

        Clock fixedClock = Clock.fixed(Instant.parse("2025-12-17T01:02:03Z"), ZoneId.of("UTC"));
        BizIdService service = new BizIdService(seg, BizIdFormatter.builder().sequenceWidth(8).build(), fixedClock, ZoneId.of("UTC"));

        int threads = 6;
        int perThread = 5_000;
        int total = threads * perThread;

        Set<String> ids = ConcurrentHashMap.newKeySet(total);
        ConcurrentLinkedQueue<Throwable> errors = new ConcurrentLinkedQueue<>();
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);
        for (int i = 0; i < threads; i++) {
            pool.submit(() -> {
                try {
                    for (int j = 0; j < perThread; j++) {
                        ids.add(service.nextId("ORD"));
                    }
                } catch (Throwable e) {
                    errors.add(e);
                } finally {
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(30, TimeUnit.SECONDS));
        pool.shutdown();
        assertTrue(pool.awaitTermination(30, TimeUnit.SECONDS));

        assertTrue(errors.isEmpty(), "errors=" + errors.peek());
        assertEquals(total, ids.size());
        // quick format sanity
        String one = ids.iterator().next();
        assertTrue(one.startsWith("ORD20251217"));

        seg.shutdown();
    }

    private static void initSchema(DataSource ds) throws Exception {
        try (Connection c = ds.getConnection(); Statement st = c.createStatement()) {
            st.execute("""
                CREATE TABLE IF NOT EXISTS biz_id_alloc (
                  biz_tag      VARCHAR(128) NOT NULL PRIMARY KEY,
                  max_id       BIGINT       NOT NULL,
                  step         INT          NOT NULL,
                  version      BIGINT       NOT NULL,
                  update_time  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """);
        }
    }
}
