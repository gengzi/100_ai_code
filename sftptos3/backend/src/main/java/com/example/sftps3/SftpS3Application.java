package com.example.sftps3;

import com.example.sftps3.config.SftpServerProperties;
import com.example.sftps3.config.StorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({SftpServerProperties.class, StorageProperties.class})
public class SftpS3Application {

    public static void main(String[] args) {
        SpringApplication.run(SftpS3Application.class, args);
    }
}
