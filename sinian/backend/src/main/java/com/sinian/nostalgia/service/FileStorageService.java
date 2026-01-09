package com.sinian.nostalgia.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String storeFile(MultipartFile file, String subDir) throws IOException {
        // 创建上传目录
        Path uploadPath = Paths.get(uploadDir, subDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + extension;

        // 保存文件
        Path targetPath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        log.info("文件保存成功: {}", targetPath);

        // 返回相对路径
        return subDir + "/" + filename;
    }

    public void deleteFile(String fileUrl) {
        try {
            Path filePath = Paths.get(uploadDir, fileUrl);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("文件删除成功: {}", filePath);
            }
        } catch (IOException e) {
            log.error("删除文件失败: {}", fileUrl, e);
        }
    }
}
