package com.example.id;

import java.lang.management.ManagementFactory;
import java.net.NetworkInterface;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

public final class MachineBasedWorkerIdAssigner implements WorkerIdAssigner {
    @Override
    public WorkerId assign(SnowflakeOptions options) {
        long datacenterMax = options.maxDatacenterId();
        long workerMax = options.maxWorkerId();

        byte[] fingerprint = buildFingerprint();
        long hash64 = hashToLong(fingerprint);

        long datacenterId = unsignedMod(hash64 >>> 32, datacenterMax + 1);
        long workerId = unsignedMod(hash64, workerMax + 1);

        WorkerId assigned = new WorkerId(datacenterId, workerId);
        options.validateWorkerId(assigned);
        return assigned;
    }

    private static byte[] buildFingerprint() {
        List<byte[]> macs = new ArrayList<>();
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            if (interfaces != null) {
                for (NetworkInterface ni : Collections.list(interfaces)) {
                    try {
                        if (ni.isLoopback() || ni.isVirtual() || !ni.isUp()) {
                            continue;
                        }
                        byte[] mac = ni.getHardwareAddress();
                        if (mac != null && mac.length > 0) {
                            macs.add(mac);
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
        } catch (Exception ignored) {
        }

        String runtime = ManagementFactory.getRuntimeMXBean().getName();
        String host = System.getenv().getOrDefault("HOSTNAME", "");
        String user = System.getProperty("user.name", "");

        int totalBytes = macs.stream().mapToInt(b -> b.length).sum();
        byte[] extra = (runtime + "|" + host + "|" + user).getBytes(StandardCharsets.UTF_8);

        byte[] out = new byte[totalBytes + extra.length];
        int pos = 0;
        for (byte[] mac : macs) {
            System.arraycopy(mac, 0, out, pos, mac.length);
            pos += mac.length;
        }
        System.arraycopy(extra, 0, out, pos, extra.length);
        return out;
    }

    private static long hashToLong(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] h = digest.digest(bytes);
            long v = 0L;
            for (int i = 0; i < 8; i++) {
                v = (v << 8) | (h[i] & 0xffL);
            }
            return v;
        } catch (Exception e) {
            long v = 1125899906842597L;
            for (byte b : bytes) {
                v = 31L * v + (b & 0xffL);
            }
            return v;
        }
    }

    private static long unsignedMod(long value, long mod) {
        long r = Long.remainderUnsigned(value, mod);
        return r < 0 ? r + mod : r;
    }
}

