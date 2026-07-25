package com.example.demo.notice.controller;

import com.example.demo.notice.dto.NotificationDto;
import com.example.demo.notice.entity.Notification;
import com.example.demo.notice.service.NotificationService;
import com.example.demo.security.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationApiController {

    private final NotificationService service;

    // 일반 공지 목록 (페이징)
    @GetMapping
    public ResponseEntity<Page<Notification>> list(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(service.getList(pageable));
    }

    // 주요 공지 목록
    @GetMapping("/important")
    public ResponseEntity<List<Notification>> importantList() {
        return ResponseEntity.ok(service.getImportant());
    }

    // 상세 조회 + 조회수 증가
    @GetMapping("/{id}")
    public ResponseEntity<Notification> detail(@PathVariable Long id) {
        service.increaseView(id);
        Notification n = service.findById(id);
        if (n == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(n);
    }

    // 공지 등록
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Notification> save(
            @RequestBody NotificationDto dto,
            @AuthenticationPrincipal CustomUserDetails details) {
        Notification n = Notification.builder()
                .userId(details.getUserId())
                .writer(details.getName())
                .title(dto.getTitle())
                .content(dto.getContent())
                .important(dto.isImportant())
                .build();
        return ResponseEntity.ok(service.save(n));
    }

    // 공지 수정
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable Long id,
            @RequestBody NotificationDto dto) {
        Notification n = Notification.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .important(dto.isImportant())
                .build();
        service.update(id, n);
        return ResponseEntity.ok().build();
    }

    // 공지 삭제
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
