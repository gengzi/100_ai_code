package com.example.bizid.repo;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.locks.LockSupport;

/**
 * 通过表 biz_id_alloc 分配号段：
 * - 首次插入 max_id=0, step=step
 * - 分配时使用 version 乐观锁：UPDATE ... WHERE version=?
 */
public final class JdbcIdAllocRepository implements IdAllocRepository {
    private static final int MAX_RETRY = 200;

    private final DataSource dataSource;

    public JdbcIdAllocRepository(DataSource dataSource) {
        this.dataSource = Objects.requireNonNull(dataSource, "dataSource");
    }

    @Override
    public Segment allocateSegment(String bizTag, int step) {
        Objects.requireNonNull(bizTag, "bizTag");
        if (step <= 0) {
            throw new IllegalArgumentException("step must be > 0");
        }

        for (int i = 0; i < MAX_RETRY; i++) {
            Row row = getOrCreateRow(bizTag, step);
            long newMax = row.maxId + step;
            long start = row.maxId + 1;
            long end = newMax;

            if (tryUpdateMaxId(bizTag, newMax, row.version)) {
                return new Segment(start, end);
            }
            backoffNanos(i);
        }
        throw new IllegalStateException("allocateSegment failed after retries. bizTag=" + bizTag);
    }

    private Row getOrCreateRow(String bizTag, int step) {
        Row row = select(bizTag);
        if (row != null) {
            return row;
        }

        // best-effort create; concurrent insert can race, so ignore duplicate error and re-select.
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement(
                     "INSERT INTO biz_id_alloc (biz_tag, max_id, step, version, update_time) VALUES (?, 0, ?, 0, ?)")) {
            ps.setString(1, bizTag);
            ps.setInt(2, step);
            ps.setObject(3, java.sql.Timestamp.from(Instant.now()));
            ps.executeUpdate();
        } catch (SQLException ignored) {
        }

        row = select(bizTag);
        if (row == null) {
            throw new IllegalStateException("cannot create/select row for bizTag=" + bizTag);
        }
        return row;
    }

    private Row select(String bizTag) {
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement("SELECT max_id, step, version FROM biz_id_alloc WHERE biz_tag = ?")) {
            ps.setString(1, bizTag);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                return new Row(rs.getLong(1), rs.getInt(2), rs.getLong(3));
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    private boolean tryUpdateMaxId(String bizTag, long newMax, long expectedVersion) {
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement(
                     "UPDATE biz_id_alloc SET max_id = ?, version = version + 1, update_time = ? WHERE biz_tag = ? AND version = ?")) {
            ps.setLong(1, newMax);
            ps.setObject(2, java.sql.Timestamp.from(Instant.now()));
            ps.setString(3, bizTag);
            ps.setLong(4, expectedVersion);
            return ps.executeUpdate() == 1;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    private static void backoffNanos(int attempt) {
        // under high contention, a tiny randomized backoff greatly increases success rate
        int capped = Math.min(attempt, 20);
        long base = 50_000L; // 0.05ms
        long max = base << capped;
        long upper = Math.min(max, 5_000_000L); // cap at 5ms
        if (upper <= base) {
            LockSupport.parkNanos(base);
            return;
        }
        long jitter = ThreadLocalRandom.current().nextLong(base, upper);
        LockSupport.parkNanos(jitter);
    }

    private record Row(long maxId, int step, long version) {
    }
}
