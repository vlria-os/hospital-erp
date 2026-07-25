package com.example.demo.schedule.aiSchedule.repository;

import com.example.demo.schedule.aiSchedule.entity.DepartmentSchedulePolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DepartmentSchedulePolicyRepository extends JpaRepository<DepartmentSchedulePolicy, Integer> {
    Optional<DepartmentSchedulePolicy> findByDepartmentDepartmentId(Integer departmentId);
    Optional<DepartmentSchedulePolicy> findByRoleRoleId(Integer roleId);
}
