package com.example.demo.notice.repository;

import com.example.demo.notice.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByImportantTrue(); //상측주요공지
    Page<Notification> findByImportantFalse(Pageable pageable);

}
