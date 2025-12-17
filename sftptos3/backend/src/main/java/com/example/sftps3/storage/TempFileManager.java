package com.example.sftps3.storage;

import com.example.sftps3.config.SftpServerProperties;
import java.io.IOException;
import java.nio.channels.FileChannel;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class TempFileManager {
    private static final Logger log = LoggerFactory.getLogger(TempFileManager.class);

    private final SftpServerProperties properties;
    private final ScheduledExecutorService sweeper = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "temp-file-sweeper");
        t.setDaemon(true);
        return t;
    });

    public TempFileManager(SftpServerProperties properties) throws IOException {
        this.properties = properties;
        Files.createDirectories(Path.of(properties.getTempDir()));
        startSweeper();
    }

    public TempFileHandle openForWrite(String sessionId, String filename) throws IOException {
        Path path = Path.of(properties.getTempDir(), sessionId + "-" + sanitize(filename));
        Path locked = Path.of(path.toString() + ".lock");
        if (!Files.exists(path)) {
            try {
                Files.createFile(path);
            } catch (FileAlreadyExistsException ignored) {
                // acceptable race
            }
        }
        FileChannel channel = FileChannel.open(path,
            StandardOpenOption.CREATE,
            StandardOpenOption.WRITE,
            StandardOpenOption.READ);
        Files.createFile(locked);
        return new TempFileHandle(path, locked, channel);
    }

    public static class TempFileHandle implements AutoCloseable {
        private final Path path;
        private final Path lock;
        private final FileChannel channel;

        TempFileHandle(Path path, Path lock, FileChannel channel) {
            this.path = path;
            this.lock = lock;
            this.channel = channel;
        }

        public FileChannel channel() {
            return channel;
        }

        public Path path() {
            return path;
        }

        @Override
        public void close() throws IOException {
            channel.close();
            Files.deleteIfExists(lock);
        }
    }

    private void startSweeper() {
        sweeper.scheduleWithFixedDelay(this::sweep, 10, 600, TimeUnit.SECONDS);
    }

    private void sweep() {
        try {
            long ttlMillis = properties.getTempTtl().toMillis();
            long now = Instant.now().toEpochMilli();
            List<Path> files = Files.list(Path.of(properties.getTempDir())).toList();
            for (Path p : files) {
                if (p.toString().endsWith(".lock")) {
                    continue;
                }
                Path lock = Path.of(p.toString() + ".lock");
                if (Files.exists(lock)) {
                    continue; // open handle or upload in progress
                }
                long lastModified = Files.getLastModifiedTime(p).toMillis();
                if (now - lastModified > ttlMillis) {
                    try {
                        long size = Files.size(p);
                        Files.deleteIfExists(p);
                        log.info("Sweeper removed temp file {} size={} reason=ttl", p, size);
                    } catch (IOException e) {
                        log.warn("Failed to delete temp file {}", p, e);
                    }
                }
            }
        } catch (IOException e) {
            log.warn("Temp sweeper failed", e);
        }
    }

    private String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
