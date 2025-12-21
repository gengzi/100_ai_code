package com.example.bizid.format;

import java.util.Objects;

public final class BizIdFormatter {
    private final int sequenceWidth;

    private BizIdFormatter(Builder builder) {
        this.sequenceWidth = builder.sequenceWidth;
        if (sequenceWidth <= 0) {
            throw new IllegalArgumentException("sequenceWidth must be > 0");
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    public String format(String prefix, String yyyymmdd, long sequence) {
        Objects.requireNonNull(prefix, "prefix");
        Objects.requireNonNull(yyyymmdd, "yyyymmdd");
        if (sequence < 0) {
            throw new IllegalArgumentException("sequence must be >= 0");
        }

        String seq = Long.toString(sequence);
        if (seq.length() > sequenceWidth) {
            throw new IllegalStateException("sequence overflow. width=" + sequenceWidth + ", value=" + sequence);
        }

        StringBuilder sb = new StringBuilder(prefix.length() + yyyymmdd.length() + sequenceWidth);
        sb.append(prefix).append(yyyymmdd);
        for (int i = seq.length(); i < sequenceWidth; i++) {
            sb.append('0');
        }
        sb.append(seq);
        return sb.toString();
    }

    public static final class Builder {
        private int sequenceWidth = 12;

        private Builder() {
        }

        public Builder sequenceWidth(int sequenceWidth) {
            this.sequenceWidth = sequenceWidth;
            return this;
        }

        public BizIdFormatter build() {
            return new BizIdFormatter(this);
        }
    }
}

