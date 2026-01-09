package com.sinian.nostalgia.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 思念人实体
 */
@Entity
@Table(name = "nostalgia_persons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NostalgiaPerson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    private String relationship; // 与用户的关系

    private String photoUrl; // 照片URL

    private String voiceUrl; // 语音文件URL

    @Lob
    private String personality; // 个性特征、记忆等（用于AI克隆）

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "nostalgiaPerson", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("createdAt DESC")
    private List<Conversation> conversations = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
