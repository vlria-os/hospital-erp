package com.example.demo.staff.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class StaffRegisterDto {
    private String email;
    private String password;
    private Integer departmentId;
    private Integer managerId;
    private List<Integer> roleIds;
    private String name;
    private String phone;
    private String address;
    private String isActive;
}
