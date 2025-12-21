package com.example.id;

public final class Base62 {
    private static final char[] ALPHABET =
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".toCharArray();

    private Base62() {
    }

    public static String encodeUnsigned(long value) {
        if (value == 0) return "0";
        char[] buf = new char[11];
        int pos = buf.length;
        long v = value;
        while (Long.compareUnsigned(v, 0L) > 0) {
            long q = Long.divideUnsigned(v, 62L);
            int r = (int) Long.remainderUnsigned(v, 62L);
            buf[--pos] = ALPHABET[r];
            v = q;
        }
        return new String(buf, pos, buf.length - pos);
    }
}

