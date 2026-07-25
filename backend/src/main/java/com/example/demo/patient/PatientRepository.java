package com.example.demo.patient;

import com.example.demo.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Integer> {
    Patient findByUser(User user);
    boolean existsByRrn(String rrn);
    Patient findByRrn(String rrn);

    Optional<Patient> findByUser_UserId(Integer userId);
}
