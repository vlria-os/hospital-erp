package com.example.demo.surgery;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SurgeryRepository extends JpaRepository<Surgery, Integer> {
    List<Surgery> findAllByOrderByStartTimeAsc();
    @Query("""
    SELECT s FROM Surgery s
    WHERE s.doctor.staffId = :staffId
    AND s.startTime BETWEEN :start AND :end
""")
    List<Surgery> findByDoctorAndDate(
            @Param("staffId") Integer staffId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}