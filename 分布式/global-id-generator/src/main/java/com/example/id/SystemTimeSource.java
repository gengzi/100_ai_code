package com.example.id;

public final class SystemTimeSource implements TimeSource {
    public static final SystemTimeSource INSTANCE = new SystemTimeSource();

    private SystemTimeSource() {
    }

    @Override
    public long currentTimeMillis() {
        return System.currentTimeMillis();
    }
}

