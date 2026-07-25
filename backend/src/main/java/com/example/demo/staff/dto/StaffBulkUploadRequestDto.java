package com.example.demo.staff.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffBulkUploadRequestDto {
    private String email;
    private String password;
    private String name;
    private String deptName;
    private String phone;
    private String address;
    private Integer managerId;
    private String isActive;
    private List<Integer> roleIds;
}
