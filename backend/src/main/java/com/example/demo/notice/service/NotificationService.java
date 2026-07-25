package com.example.demo.notice.service;

import com.example.demo.notice.entity.Notification;
import com.example.demo.notice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository repository;

    public List<Notification> getImportant(){
        return  repository.findByImportantTrue();

    }
   public Page<Notification> getList(Pageable pageable){
        return  repository.findByImportantFalse(pageable);
    }
   public Notification findById(Long id){
      return  repository.findById(id).orElse(null);
    }
   public Notification save(Notification n){ return  repository.save(n); }
   public void delete(Long id) {
      repository.deleteById(id);
   }
   public void increaseView(Long id) {
       Notification n = repository.findById(id).orElseThrow();
       n.setViewCount(n.getViewCount() + 1);
       repository.save(n);
   }
   public void update(Long id, Notification n) {
        Notification find = repository.findById(id).orElseThrow();
        find.setTitle(n.getTitle());
        find.setContent(n.getContent());
        find.setImportant(n.isImportant());
   }
}

