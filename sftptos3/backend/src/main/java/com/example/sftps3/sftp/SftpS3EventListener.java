package com.example.sftps3.sftp;

import com.example.sftps3.config.SftpServerProperties;
import com.example.sftps3.config.StorageProperties;
import com.example.sftps3.storage.S3AsyncClientFactory;
import java.io.IOException;
import java.nio.file.Path;
import java.util.Collection;
import java.util.Objects;
import org.apache.sshd.server.session.ServerSession;
import org.apache.sshd.sftp.server.SftpEventListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3AsyncClient;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

/**
 * Keeps S3 in sync for delete/rename events coming from SFTP.
 */
@Component
public class SftpS3EventListener implements SftpEventListener {
    private static final Logger log = LoggerFactory.getLogger(SftpS3EventListener.class);

    private final SftpServerProperties sftpProps;
    private final StorageProperties storageProps;
    private final S3AsyncClientFactory s3Factory;
    private final S3PathMapper pathMapper;
    private final String tempRoot;

    public SftpS3EventListener(SftpServerProperties sftpProps,
                               StorageProperties storageProps,
                               S3AsyncClientFactory s3Factory) {
        this.sftpProps = sftpProps;
        this.storageProps = storageProps;
        this.s3Factory = s3Factory;
        this.pathMapper = new S3PathMapper(resolveTarget());
        this.tempRoot = Path.of(sftpProps.getTempDir()).toAbsolutePath().normalize().toString();
    }

    @Override
    public void removed(ServerSession session, Path path, boolean isDirectory, Throwable thrown) throws IOException {
        if (thrown != null || isDirectory) {
            return;
        }
        String key = toKey(path);
        StorageProperties.StorageTarget target = resolveTarget();
        log.info("Deleting S3 object bucket={} key={} by {}", target.getBucket(), key, session.getUsername());
        S3AsyncClient client = s3Factory.get(target);
        client.deleteObject(DeleteObjectRequest.builder()
            .bucket(target.getBucket())
            .key(key)
            .build()).join();
    }

    @Override
    public void moved(ServerSession session, Path srcPath, Path dstPath, Collection<java.nio.file.CopyOption> opts, Throwable thrown)
        throws IOException {
        if (thrown != null) {
            return;
        }
        StorageProperties.StorageTarget target = resolveTarget();
        String srcKey = toKey(srcPath);
        String dstKey = toKey(dstPath);
        log.info("Rename S3 object bucket={} {} -> {} by {}", target.getBucket(), srcKey, dstKey, session.getUsername());
        S3AsyncClient client = s3Factory.get(target);
        client.copyObject(CopyObjectRequest.builder()
            .sourceBucket(target.getBucket())
            .sourceKey(srcKey)
            .destinationBucket(target.getBucket())
            .destinationKey(dstKey)
            .build()).join();
        client.deleteObject(DeleteObjectRequest.builder()
            .bucket(target.getBucket())
            .key(srcKey)
            .build()).join();
    }

    private StorageProperties.StorageTarget resolveTarget() {
        if (storageProps.getTargets() == null || storageProps.getTargets().isEmpty()) {
            throw new IllegalStateException("No storage target configured");
        }
        return Objects.requireNonNull(storageProps.getTargets().get(0));
    }

    private String toKey(Path localPath) {
        Path normalized = localPath.toAbsolutePath().normalize();
        String rel = normalized.toString().replace(tempRoot, "");
        String sftpPath = rel.replace('\\', '/');
        if (!sftpPath.startsWith("/")) {
            sftpPath = "/" + sftpPath;
        }
        return pathMapper.toKey(sftpPath);
    }
}
