package com.example.demo.staff.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffResponseDto {

    private Integer staffId;
    private String name;
    private String phone;
    private String address;

    private Integer userId;
    private String email;

    private Integer departmentId;
    private  String departmentName;
    private String roleName;
    private Integer managerId;
    private String managerName;
    private String isActive;
}
