package com.example.bizid.repo;

public record Segment(long startInclusive, long endInclusive) {
    public Segment {
        if (startInclusive <= 0) {
            throw new IllegalArgumentException("startInclusive must be > 0");
        }
        if (endInclusive < startInclusive) {
            throw new IllegalArgumentException("endInclusive must be >= startInclusive");
        }
    }

    public long size() {
        return endInclusive - startInclusive + 1;
    }
}

