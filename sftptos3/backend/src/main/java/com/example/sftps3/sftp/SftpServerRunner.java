package com.example.sftps3.sftp;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.apache.sshd.server.SshServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SftpServerRunner {
    private static final Logger log = LoggerFactory.getLogger(SftpServerRunner.class);

    private final SshServer sshServer;

    public SftpServerRunner(SshServer sshServer) {
        this.sshServer = sshServer;
    }

    @PostConstruct
    public void start() throws Exception {
        log.info("Starting SFTP server on {}:{}", sshServer.getHost(), sshServer.getPort());
        sshServer.start();
    }

    @PreDestroy
    public void stop() throws Exception {
        log.info("Stopping SFTP server");
        sshServer.stop();
    }
}
