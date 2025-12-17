package com.example.sftps3.storage;

import com.example.sftps3.config.StorageProperties;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.http.async.SdkAsyncHttpClient;
import software.amazon.awssdk.http.nio.netty.NettyNioAsyncHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3AsyncClient;
import software.amazon.awssdk.services.s3.S3Configuration;

@Component
public class S3AsyncClientFactory {
    private static final Logger log = LoggerFactory.getLogger(S3AsyncClientFactory.class);

    private final Map<String, S3AsyncClient> cache = new ConcurrentHashMap<>();

    public S3AsyncClient get(StorageProperties.StorageTarget target) {
        return cache.computeIfAbsent(target.getName(), name -> build(target));
    }

    private S3AsyncClient build(StorageProperties.StorageTarget target) {
        log.info("Creating S3AsyncClient for target {}", target.getName());
        SdkAsyncHttpClient httpClient = NettyNioAsyncHttpClient.builder()
            .maxConcurrency(256)
            .readTimeout(Duration.ofSeconds(60))
            .writeTimeout(Duration.ofSeconds(60))
            .build();

        ClientOverrideConfiguration override = ClientOverrideConfiguration.builder()
            .apiCallAttemptTimeout(Duration.ofMinutes(5))
            .apiCallTimeout(Duration.ofMinutes(10))
            .build();

        S3Configuration serviceConf = S3Configuration.builder()
            .checksumValidationEnabled(true)
            .pathStyleAccessEnabled(target.isPathStyle())
            .build();

        S3AsyncClient.Builder builder = S3AsyncClient.builder()
            .httpClient(httpClient)
            .overrideConfiguration(override)
            .serviceConfiguration(serviceConf)
            .region(Region.of(target.getRegion()))
            .credentialsProvider(credentials(target));

        if (target.getEndpoint() != null) {
            builder = builder.endpointOverride(target.getEndpoint());
        }

        return builder.build();
    }

    private AwsCredentialsProvider credentials(StorageProperties.StorageTarget target) {
        if (target.hasStaticCredentials()) {
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(target.getAccessKey(), target.getSecretKey()));
        }
        return DefaultCredentialsProvider.create();
    }
}
