package com.example.bizid;

import com.example.bizid.format.BizIdFormatter;
import com.example.bizid.repo.IdAllocRepository;
import com.example.bizid.repo.JdbcIdAllocRepository;
import com.example.bizid.segment.SegmentIdGenerator;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public final class ExampleMain {
    public static void main(String[] args) throws Exception {
        DataSource ds = simpleH2();
        initSchema(ds);

        IdAllocRepository repo = new JdbcIdAllocRepository(ds);
        SegmentIdGenerator generator = SegmentIdGenerator.builder(repo)
                .defaultStep(5_000)
                .build();

        BizIdService service = new BizIdService(generator, BizIdFormatter.builder().sequenceWidth(10).build());

        for (int i = 0; i < 5; i++) {
            System.out.println(service.nextId("ORD"));
        }

        generator.shutdown();
    }

    private static DataSource simpleH2() {
        return new DataSource() {
            @Override public Connection getConnection() {
                try {
                    return DriverManager.getConnection("jdbc:h2:mem:bizid;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }
            @Override public Connection getConnection(String username, String password) { return getConnection(); }
            @Override public <T> T unwrap(Class<T> iface) { throw new UnsupportedOperationException(); }
            @Override public boolean isWrapperFor(Class<?> iface) { return false; }
            @Override public java.io.PrintWriter getLogWriter() { throw new UnsupportedOperationException(); }
            @Override public void setLogWriter(java.io.PrintWriter out) { throw new UnsupportedOperationException(); }
            @Override public void setLoginTimeout(int seconds) { throw new UnsupportedOperationException(); }
            @Override public int getLoginTimeout() { return 0; }
            @Override public java.util.logging.Logger getParentLogger() { throw new UnsupportedOperationException(); }
        };
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

