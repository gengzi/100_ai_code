package com.example.id;

public interface IdGenerator {
    long nextId();

    default String nextIdAsString() {
        return Long.toUnsignedString(nextId());
    }
}

