package com.example.demo.staff.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffUpdateDto {
    private Integer staffId;

    private Integer userId;
    private Integer departmentId;
    private Integer managerId;
    private List<Integer> roleIds;
    private String name;
    private String phone;
    private String address;
    private String isActive;
}
