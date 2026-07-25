package com.example.demo.schedule.aiSchedule.repository;

import com.example.demo.schedule.aiSchedule.entity.DepartmentSchedulePolicyShift;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DepartmentSchedulePolicyShiftRepository extends JpaRepository<DepartmentSchedulePolicyShift, Integer> {
    List<DepartmentSchedulePolicyShift> findByPolicyPolicyId(Integer policyId);
    void deleteByPolicyPolicyId(Integer policyId);
}
