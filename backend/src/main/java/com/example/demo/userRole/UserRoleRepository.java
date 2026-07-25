package com.example.demo.userRole;

import com.example.demo.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRole, Integer> {
    List<UserRole> findByUserIn(List<User> users);
    List<UserRole> findByUser(User user);
    void deleteByUser(User user);
    boolean existsByUser_UserIdAndRole_RoleName(Integer userId, String roleName);
}
