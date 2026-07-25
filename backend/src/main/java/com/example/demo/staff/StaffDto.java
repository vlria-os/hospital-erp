package com.example.demo.staff;

import com.example.demo.department.Department;
import com.example.demo.user.User;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class StaffDto {
    private Integer staffId;
    private User user;
    private Department department;
    private Staff manager;
    private String name;
    private String phone;
    private String address;
}
