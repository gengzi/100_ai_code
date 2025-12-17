package com.example.sftps3.sftp;

import com.example.sftps3.config.SftpServerProperties;
import com.example.sftps3.config.StorageProperties;
import com.example.sftps3.storage.S3AsyncClientFactory;
import java.io.IOException;
import java.nio.channels.FileChannel;
import java.nio.channels.SeekableByteChannel;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.OpenOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.apache.sshd.sftp.server.FileHandle;
import org.apache.sshd.sftp.server.SftpFileSystemAccessor;
import org.apache.sshd.sftp.server.SftpSubsystemProxy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.async.AsyncRequestBody;
import software.amazon.awssdk.core.async.AsyncResponseTransformer;
import software.amazon.awssdk.services.s3.S3AsyncClient;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * FileSystemAccessor backed by a local temp directory; prefetches missing files from S3 on read
 * and uploads to S3 when the channel is closed.
 */
@Component
public class S3SftpFileSystemAccessor implements SftpFileSystemAccessor {
    private static final Logger log = LoggerFactory.getLogger(S3SftpFileSystemAccessor.class);
    private static final long SMALL_FILE_THRESHOLD = 64L * 1024 * 1024; // 64MB

    private final SftpServerProperties sftpProps;
    private final StorageProperties storageProps;
    private final S3AsyncClientFactory s3Factory;
    private final S3PathMapper pathMapper;
    private final Path root;
    private final Map<Path, S3Meta> metaCache = new ConcurrentHashMap<>();

    public S3SftpFileSystemAccessor(SftpServerProperties sftpProps,
                                    StorageProperties storageProps,
                                    S3AsyncClientFactory s3Factory) {
        this.sftpProps = sftpProps;
        this.storageProps = storageProps;
        this.s3Factory = s3Factory;
        this.root = Path.of(sftpProps.getTempDir()).toAbsolutePath().normalize();
        this.pathMapper = new S3PathMapper(resolveTarget());
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to create temp directory " + root, e);
        }
    }

    @Override
    public SeekableByteChannel openFile(
        SftpSubsystemProxy subsystem,
        FileHandle fileHandle,
        Path file,
        String handle,
        Collection<? extends OpenOption> options,
        java.nio.file.attribute.FileAttribute<?>... attrs) throws IOException {

        if (file.getParent() != null) {
            Files.createDirectories(file.getParent());
        }
        boolean writeMode = isWrite(options);
        if (!writeMode) {
            // read: prefetch from S3 if local is missing
            if (Files.notExists(file)) {
                downloadFromS3(file);
            }
            return Files.newByteChannel(file, options, attrs);
        }

        // write: open local file; upload to S3 when channel is closed
        FileChannel channel = FileChannel.open(file, options.toArray(OpenOption[]::new));
        return new UploadOnCloseChannel(channel, file);
    }

    @Override
    public DirectoryStream<Path> openDirectory(
        SftpSubsystemProxy subsystem,
        org.apache.sshd.sftp.server.DirectoryHandle dirHandle,
        Path dir,
        String handle,
        java.nio.file.LinkOption... linkOptions) throws IOException {

        // list from S3, create local placeholders, and cache metadata for stat
        StorageProperties.StorageTarget target = resolveTarget();
        String prefix = toKey(dir).endsWith("/") ? toKey(dir) : toKey(dir) + "/";
        S3AsyncClient client = s3Factory.get(target);

        var req = software.amazon.awssdk.services.s3.model.ListObjectsV2Request.builder()
            .bucket(target.getBucket())
            .prefix(prefix.equals("/") ? "" : prefix)
            .delimiter("/")
            .build();

        var resp = client.listObjectsV2(req).join();
        java.util.List<Path> paths = new ArrayList<>();

        if (resp.commonPrefixes() != null) {
            for (var cp : resp.commonPrefixes()) {
                String rel = cp.prefix().substring(prefix.length());
                if (rel.isEmpty()) {
                    continue;
                }
                Path p = dir.resolve(rel);
                Files.createDirectories(p);
                metaCache.put(p, S3Meta.dir());
                paths.add(p);
            }
        }
        if (resp.contents() != null) {
            for (var obj : resp.contents()) {
                String relKey = obj.key().substring(prefix.length());
                if (relKey.isEmpty()) {
                    continue;
                }
                Path p = dir.resolve(relKey);
                Files.createDirectories(p.getParent());
                if (Files.notExists(p)) {
                    Files.createFile(p);
                }
                metaCache.put(p, S3Meta.file(obj.size(), obj.lastModified()));
                paths.add(p);
                try {
                    Files.setLastModifiedTime(p, FileTime.from(obj.lastModified()));
                } catch (IOException ignored) {
                    // best effort
                }
            }
        }

        return new DirectoryStream<>() {
            @Override
            public java.util.Iterator<Path> iterator() {
                return paths.iterator();
            }

            @Override
            public void close() {
                // no-op
            }
        };
    }

    @Override
    public java.util.NavigableMap<String, Object> resolveReportedFileAttributes(
        SftpSubsystemProxy subsystem,
        Path file,
        int flags,
        java.util.NavigableMap<String, Object> attrs,
        java.nio.file.LinkOption... options) throws IOException {
        S3Meta meta = metaCache.get(file);
        if (meta != null) {
            attrs.put(org.apache.sshd.common.util.io.IoUtils.SIZE_VIEW_ATTR, meta.size());
            attrs.put(org.apache.sshd.common.util.io.IoUtils.LASTMOD_TIME_VIEW_ATTR,
                FileTime.from(meta.lastModified()));
            attrs.put(org.apache.sshd.common.util.io.IoUtils.DIRECTORY_VIEW_ATTR, meta.isDir());
            attrs.put(org.apache.sshd.common.util.io.IoUtils.REGFILE_VIEW_ATTR, !meta.isDir());
        }
        return attrs;
    }

    private boolean isWrite(Collection<? extends OpenOption> options) {
        Set<OpenOption> set = options.stream().collect(Collectors.toSet());
        return set.contains(StandardOpenOption.WRITE)
            || set.contains(StandardOpenOption.APPEND)
            || set.contains(StandardOpenOption.CREATE)
            || set.contains(StandardOpenOption.CREATE_NEW)
            || set.contains(StandardOpenOption.TRUNCATE_EXISTING);
    }

    private void downloadFromS3(Path targetPath) throws IOException {
        StorageProperties.StorageTarget target = resolveTarget();
        String key = toKey(targetPath);
        log.info("Prefetch from S3 bucket={} key={} -> {}", target.getBucket(), key, targetPath);
        if (targetPath.getParent() != null) {
            Files.createDirectories(targetPath.getParent());
        }
        S3AsyncClient client = s3Factory.get(target);
        GetObjectRequest req = GetObjectRequest.builder()
            .bucket(target.getBucket())
            .key(key)
            .build();
        CompletableFuture<Void> future = client.getObject(req, AsyncResponseTransformer.toFile(targetPath));
        try {
            future.join();
        } catch (Exception e) {
            throw new IOException("Download from S3 failed", e);
        }
    }

    private void uploadToS3(Path filePath) throws IOException {
        StorageProperties.StorageTarget target = resolveTarget();
        String key = toKey(filePath);
        long size = Files.size(filePath);
        log.info("Upload to S3 bucket={} key={} size={}", target.getBucket(), key, size);
        S3AsyncClient client = s3Factory.get(target);
        PutObjectRequest req = PutObjectRequest.builder()
            .bucket(target.getBucket())
            .key(key)
            .contentLength(size)
            .build();
        // TODO: switch to multipart upload for large files
        CompletableFuture<?> future = client.putObject(req, AsyncRequestBody.fromFile(filePath));
        try {
            future.join();
            Files.deleteIfExists(filePath);
        } catch (Exception e) {
            throw new IOException("Upload to S3 failed", e);
        }
    }

    private String toKey(Path localPath) {
        Path relative;
        try {
            relative = root.relativize(localPath.toAbsolutePath().normalize());
        } catch (IllegalArgumentException e) {
            relative = localPath.getFileName();
        }
        String sftpPath = "/" + relative.toString().replace('\\', '/');
        return pathMapper.toKey(sftpPath);
    }

    private StorageProperties.StorageTarget resolveTarget() {
        if (storageProps.getTargets() == null || storageProps.getTargets().isEmpty()) {
            throw new IllegalStateException("No storage target configured");
        }
        return Objects.requireNonNull(storageProps.getTargets().get(0));
    }

    private record S3Meta(boolean isDir, long size, Instant lastModified) {
        static S3Meta dir() {
            return new S3Meta(true, 0, Instant.now());
        }

        static S3Meta file(long size, Instant lastModified) {
            return new S3Meta(false, size, lastModified == null ? Instant.now() : lastModified);
        }
    }

    private class UploadOnCloseChannel implements SeekableByteChannel {
        private final FileChannel delegate;
        private final Path filePath;
        private boolean closed = false;

        UploadOnCloseChannel(FileChannel delegate, Path filePath) {
            this.delegate = delegate;
            this.filePath = filePath;
        }

        @Override
        public int read(java.nio.ByteBuffer dst) throws IOException {
            return delegate.read(dst);
        }

        @Override
        public int write(java.nio.ByteBuffer src) throws IOException {
            return delegate.write(src);
        }

        @Override
        public long position() throws IOException {
            return delegate.position();
        }

        @Override
        public SeekableByteChannel position(long newPosition) throws IOException {
            delegate.position(newPosition);
            return this;
        }

        @Override
        public long size() throws IOException {
            return delegate.size();
        }

        @Override
        public SeekableByteChannel truncate(long size) throws IOException {
            delegate.truncate(size);
            return this;
        }

        @Override
        public boolean isOpen() {
            return delegate.isOpen();
        }

        @Override
        public void close() throws IOException {
            if (closed) {
                return;
            }
            closed = true;
            delegate.close();
            uploadToS3(filePath);
        }
    }
}
