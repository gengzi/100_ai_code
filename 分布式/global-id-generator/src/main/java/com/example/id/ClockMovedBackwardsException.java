package com.example.id;

public final class ClockMovedBackwardsException extends RuntimeException {
    private final long lastTimestampMillis;
    private final long currentTimestampMillis;

    public ClockMovedBackwardsException(long lastTimestampMillis, long currentTimestampMillis) {
        super("Clock moved backwards. last=" + lastTimestampMillis + ", current=" + currentTimestampMillis);
        this.lastTimestampMillis = lastTimestampMillis;
        this.currentTimestampMillis = currentTimestampMillis;
    }

    public long getLastTimestampMillis() {
        return lastTimestampMillis;
    }

    public long getCurrentTimestampMillis() {
        return currentTimestampMillis;
    }
}

