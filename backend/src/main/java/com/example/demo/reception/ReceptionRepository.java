package com.example.demo.reception;

import com.example.demo.patient.Patient;
import com.example.demo.reservation.Reservation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface ReceptionRepository extends JpaRepository<Reception,Integer> {
    @Query("""
    SELECT r FROM Reception r
    JOIN r.reservation v
    JOIN v.slot s
    JOIN v.patient p
    WHERE s.startTime BETWEEN :start AND :end
    AND (:name IS NULL OR p.name LIKE CONCAT('%', :name, '%'))
    AND v.status NOT IN ('CANCELED')
    ORDER BY s.startTime ASC
    """)
    Page<Reception> findTodayReception(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("name") String name,
            Pageable pageable
    );

    @Query("""
    SELECT r FROM Reception r
    JOIN r.reservation v
    JOIN v.slot s
    JOIN v.patient p
    WHERE s.startTime BETWEEN :start AND :end
    AND r.status = :status
    AND (:name IS NULL OR p.name LIKE CONCAT('%', :name, '%'))
    ORDER BY s.startTime ASC
    """)
    Page<Reception> findTodayReception(@Param("start") LocalDateTime start,
                                       @Param("end") LocalDateTime end,
                                       @Param("status") ReceptionStatus status,
                                       @Param("name") String name,
                                       Pageable pageable);

    Reception findByReservation(Reservation reservation);

    @Query("""
        SELECT r FROM Reception r
        JOIN r.reservation v
        JOIN v.staff s
        JOIN v.slot sl
        WHERE r.receptionTime BETWEEN :start AND :end
        AND s.staffId = :doctorId
        AND (
            (:status IS NOT NULL AND r.status = :status)
            OR
            (:status IS NULL AND r.status NOT IN ('PENDING', 'CANCELED'))
        )
        ORDER BY sl.startTime ASC
        """)
    Page<Reception> findTodayReceptionWaiting(@Param("start") LocalDateTime start,
                                               @Param("end") LocalDateTime end,
                                               ReceptionStatus status,
                                               Integer doctorId,
                                               Pageable pageable);

    @Query(
            value = """
        select r
        from Reception r
        where r.reservation.patient = :patient
        and r.status = :status
        order by r.reservation.slot.startTime desc
    """,
            countQuery = """
        select count(r)
        from Reception r
        where r.reservation.patient = :patient
        and r.status = :status
    """
    )
    Page<Reception> findMyReceptionRecordsDesc(Patient patient, ReceptionStatus status, Pageable pageable);

    @Query(
            value = """
        select r
        from Reception r
        where r.reservation.patient = :patient
        and r.status = :status
        order by r.reservation.slot.startTime asc
    """,
            countQuery = """
        select count(r)
        from Reception r
        where r.reservation.patient = :patient
        and r.status = :status
    """
    )
    Page<Reception> findMyReceptionRecordsAsc(Patient patient, ReceptionStatus status, Pageable pageable);

    Optional<Reception> findByReceptionId(Integer receptionId);
}
