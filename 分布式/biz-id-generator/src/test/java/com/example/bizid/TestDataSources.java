package com.example.bizid;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;

public final class TestDataSources {
    private TestDataSources() {
    }

    public static DataSource h2(String name) {
        String url = "jdbc:h2:mem:" + name + ";MODE=MySQL;DB_CLOSE_DELAY=-1";
        return new DataSource() {
            @Override public Connection getConnection() {
                try {
                    return DriverManager.getConnection(url, "sa", "");
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
}
