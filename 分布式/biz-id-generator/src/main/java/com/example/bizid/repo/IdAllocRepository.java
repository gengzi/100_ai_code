package com.example.bizid.repo;

/**
 * 号段分配仓库：以 bizTag 为 key，向中心存储申请一个连续区间。
 */
public interface IdAllocRepository {
    Segment allocateSegment(String bizTag, int step);
}

