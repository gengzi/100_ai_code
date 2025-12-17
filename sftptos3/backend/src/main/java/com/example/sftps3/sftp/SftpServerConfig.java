package com.example.sftps3.sftp;

import com.example.sftps3.config.SftpServerProperties;
import java.nio.file.Path;
import org.apache.sshd.common.file.virtualfs.VirtualFileSystemFactory;
import org.apache.sshd.common.keyprovider.KeyPairProvider;
import org.apache.sshd.server.SshServer;
import org.apache.sshd.server.keyprovider.SimpleGeneratorHostKeyProvider;
import org.apache.sshd.server.session.ServerSession;
import org.apache.sshd.sftp.server.SftpSubsystemFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SftpServerConfig {

    @Bean
    public VirtualFileSystemFactory virtualFileSystemFactory(SftpServerProperties props) {
        Path root = Path.of(props.getTempDir()).toAbsolutePath().normalize();
        return new VirtualFileSystemFactory(root);
    }

    @Bean
    public SshServer sshServer(SftpServerProperties props,
                               VirtualFileSystemFactory vfs,
                               SftpS3EventListener s3Listener,
                               S3SftpFileSystemAccessor accessor) {
        SshServer sshd = SshServer.setUpDefaultServer();
        sshd.setHost(props.getHost());
        sshd.setPort(props.getPort());
        sshd.setKeyPairProvider(hostKey(props));
        // TODO auth/authorization: currently allow any password/public key for dev only
        sshd.setPasswordAuthenticator((username, password, session) -> true);
        sshd.setPublickeyAuthenticator((username, key, session) -> true);
        sshd.setFileSystemFactory(vfs);

        SftpSubsystemFactory subsystem = new SftpSubsystemFactory.Builder()
            .withFileSystemAccessor(accessor)
            .addSftpEventListener(s3Listener)
            .build();
        sshd.setSubsystemFactories(java.util.List.of(subsystem));
        sshd.addSessionListener(new org.apache.sshd.server.session.SessionListener() {
            @Override
            public void sessionCreated(ServerSession session) {
                // hook for logging/metrics
            }
        });
        return sshd;
    }

    private KeyPairProvider hostKey(SftpServerProperties props) {
        SimpleGeneratorHostKeyProvider provider = new SimpleGeneratorHostKeyProvider();
        provider.setPath(props.getHostKeyFile());
        return provider;
    }
}
