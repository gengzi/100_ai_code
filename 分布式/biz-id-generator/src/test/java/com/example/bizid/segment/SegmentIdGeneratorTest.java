package com.example.bizid.segment;

import com.example.bizid.TestDataSources;
import com.example.bizid.repo.IdAllocRepository;
import com.example.bizid.repo.JdbcIdAllocRepository;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SegmentIdGeneratorTest {
    @Test
    void generatesUniqueIdsConcurrently() throws Exception {
        DataSource ds = TestDataSources.h2("genTest");
        initSchema(ds);
        IdAllocRepository repo = new JdbcIdAllocRepository(ds);
        SegmentIdGenerator gen = SegmentIdGenerator.builder(repo).defaultStep(2000).prefetchThreshold(50).build();

        String tag = "ORD:20251217";
        int threads = 8;
        int perThread = 20_000;
        int total = threads * perThread;

        Set<Long> ids = ConcurrentHashMap.newKeySet(total);
        ConcurrentLinkedQueue<Throwable> errors = new ConcurrentLinkedQueue<>();
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);
        for (int i = 0; i < threads; i++) {
            pool.submit(() -> {
                try {
                    for (int j = 0; j < perThread; j++) {
                        ids.add(gen.nextId(tag));
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
        gen.shutdown();
        assertTrue(errors.isEmpty(), "errors=" + errors.peek());
        assertEquals(total, ids.size());
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
