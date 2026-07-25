package com.example.demo.schedule.staff.repository;

import com.example.demo.schedule.staff.entity.StaffScheduleType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StaffScheduleTypeRepository extends JpaRepository<StaffScheduleType, Integer> {
    boolean existsByTypeCode(String typeCode);
    Optional<StaffScheduleType> findByTypeCode(String typeCode);

    List<String> findByIsActive(Boolean isActive);
}
