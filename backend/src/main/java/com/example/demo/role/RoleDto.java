package com.example.demo.role;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleDto {
    private Integer roleId;
    private String roleName;
    private String parentRoleName;
}
