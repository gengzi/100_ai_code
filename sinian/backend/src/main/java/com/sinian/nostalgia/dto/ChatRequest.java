package com.sinian.nostalgia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChatRequest {

    @NotNull(message = "思念人ID不能为空")
    private Long personId;

    @NotBlank(message = "消息内容不能为空")
    private String message;
}
