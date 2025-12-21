package com.example.id;

import java.util.Objects;

public final class WorkerId {
    private final long datacenterId;
    private final long workerId;

    public WorkerId(long datacenterId, long workerId) {
        this.datacenterId = datacenterId;
        this.workerId = workerId;
    }

    public long datacenterId() {
        return datacenterId;
    }

    public long workerId() {
        return workerId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof WorkerId that)) return false;
        return datacenterId == that.datacenterId && workerId == that.workerId;
    }

    @Override
    public int hashCode() {
        return Objects.hash(datacenterId, workerId);
    }

    @Override
    public String toString() {
        return "WorkerId{datacenterId=" + datacenterId + ", workerId=" + workerId + '}';
    }
}

