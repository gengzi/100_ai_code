package com.example.bizid.repo;

import com.example.bizid.TestDataSources;
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

class JdbcIdAllocRepositoryTest {
    @Test
    void allocatesUniqueSegmentsConcurrently() throws Exception {
        DataSource ds = TestDataSources.h2("repoTest");
        initSchema(ds);

        JdbcIdAllocRepository repo = new JdbcIdAllocRepository(ds);
        int threads = 10;
        int loops = 200;
        int step = 50;
        String tag = "ORD:20251217";

        Set<Long> segmentStarts = ConcurrentHashMap.newKeySet();
        ConcurrentLinkedQueue<Throwable> errors = new ConcurrentLinkedQueue<>();
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);

        for (int t = 0; t < threads; t++) {
            pool.submit(() -> {
                try {
                    for (int i = 0; i < loops; i++) {
                        Segment s = repo.allocateSegment(tag, step);
                        segmentStarts.add(s.startInclusive());
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
        assertEquals(threads * loops, segmentStarts.size());
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
