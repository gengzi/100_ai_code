package com.example.bizid;

import com.example.bizid.format.BizIdFormatter;
import com.example.bizid.segment.SegmentIdGenerator;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

/**
 * 业务全局 ID：prefix + yyyyMMdd + sequence(零填充).
 * 序列由 SegmentIdGenerator（号段）提供，bizTag 默认按天拆分，从而实现“每日重置”。
 */
public final class BizIdService {
    private static final DateTimeFormatter DAY = DateTimeFormatter.BASIC_ISO_DATE; // yyyyMMdd

    private final SegmentIdGenerator segmentIdGenerator;
    private final BizIdFormatter formatter;
    private final Clock clock;
    private final ZoneId zoneId;

    public BizIdService(SegmentIdGenerator segmentIdGenerator, BizIdFormatter formatter) {
        this(segmentIdGenerator, formatter, Clock.systemUTC(), ZoneId.of("UTC"));
    }

    public BizIdService(SegmentIdGenerator segmentIdGenerator, BizIdFormatter formatter, Clock clock, ZoneId zoneId) {
        this.segmentIdGenerator = Objects.requireNonNull(segmentIdGenerator, "segmentIdGenerator");
        this.formatter = Objects.requireNonNull(formatter, "formatter");
        this.clock = Objects.requireNonNull(clock, "clock");
        this.zoneId = Objects.requireNonNull(zoneId, "zoneId");
    }

    /**
     * @param bizCode 业务编码（如 ORD/REF/INV）
     */
    public String nextId(String bizCode) {
        Objects.requireNonNull(bizCode, "bizCode");
        LocalDate day = LocalDate.now(clock.withZone(zoneId));
        String date = DAY.format(day);
        String bizTag = bizCode + ":" + date;
        long seq = segmentIdGenerator.nextId(bizTag);
        return formatter.format(bizCode, date, seq);
    }
}

