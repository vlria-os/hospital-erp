package com.example.demo.role;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/role")
@RequiredArgsConstructor
public class RoleController {

    private final RoleRepository roleRepository;

    @GetMapping("/list")
    public ResponseEntity<List<RoleDto>> getRoleList() {
        List<String> excludedRoles = List.of("PATIENT", "DOCTOR", "ADMINISTRATION");

        return ResponseEntity.ok(
            roleRepository.findAll().stream()
                .filter(role -> !excludedRoles.contains(role.getRoleName()))
                .map(role -> RoleDto.builder()
                        .roleId(role.getRoleId())
                        .roleName(role.getRoleName())
                        .parentRoleName(role.getParentRole() != null ? role.getParentRole().getRoleName() : null)
                        .build())
                .toList()
        );
    }
}
