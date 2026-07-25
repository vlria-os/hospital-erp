package com.example.demo.role;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoleRepository extends JpaRepository<Role, Integer> {
    Role findByRoleId(Integer roleId);
    Role findByRoleName(String role);

    // 다른 role의 부모로 쓰이지 않는 것만 조회 (직접 배정 가능한 role)
    List<Role> findByRoleIdNotIn(List<Integer> parentRoleIds);
}
