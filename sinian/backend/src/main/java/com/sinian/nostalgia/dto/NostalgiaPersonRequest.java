package com.sinian.nostalgia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NostalgiaPersonRequest {

    @NotBlank(message = "姓名不能为空")
    private String name;

    @Size(max = 1000, message = "描述不能超过1000字")
    private String description;

    private String relationship;

    private String personality;
}
