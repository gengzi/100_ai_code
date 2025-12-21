package com.example.id;

@FunctionalInterface
public interface TimeSource {
    long currentTimeMillis();
}

