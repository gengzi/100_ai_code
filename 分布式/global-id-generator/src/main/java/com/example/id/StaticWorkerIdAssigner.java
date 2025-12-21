package com.example.id;

public final class StaticWorkerIdAssigner implements WorkerIdAssigner {
    private final WorkerId workerId;

    public StaticWorkerIdAssigner(long datacenterId, long workerId) {
        this.workerId = new WorkerId(datacenterId, workerId);
    }

    @Override
    public WorkerId assign(SnowflakeOptions options) {
        options.validateWorkerId(workerId);
        return workerId;
    }
}

