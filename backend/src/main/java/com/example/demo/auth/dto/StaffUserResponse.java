package com.example.demo.auth.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class StaffUserResponse {
    private Integer staffId;
    private Integer userId;
    private Integer departmentId;
    private String name;
    private List<Integer> roles;
    private Integer managerId;
    private String phone;
    private String address;
    private String email;
    private String password;
    private LocalDateTime createdAt;
    private String status;

    public Map<String, Object> getClaims(){
        Map<String,Object> data=new HashMap<>();
        data.put("staffId",staffId);
        data.put("departmentId",departmentId);
        data.put("name",name);
        data.put("email",email);
        return data;
    }
}
