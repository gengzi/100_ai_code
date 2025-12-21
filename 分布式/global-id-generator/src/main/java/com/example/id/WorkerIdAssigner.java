package com.example.id;

public interface WorkerIdAssigner {
    WorkerId assign(SnowflakeOptions options);
}

