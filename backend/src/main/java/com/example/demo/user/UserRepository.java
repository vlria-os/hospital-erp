package com.example.demo.user;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    @EntityGraph(attributePaths = {"userRoles", "userRoles.role"})
    @Query("select u from User u where u.email=:email")
    Optional<User> getWithRoles(@Param("email") String email);

    Optional<User> findByUserId(Integer userId);
    List<User> findByUserIdIsNot(Integer userId);

    boolean existsByEmail(String email);
}
