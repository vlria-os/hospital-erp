package com.example.demo.socialAccount;

import com.example.demo.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SocialAccountRepository extends JpaRepository<SocialAccount, Integer> {
    SocialAccount findByProviderAndProviderId(SocialAccountProvider provider, String providerId);
    List<SocialAccount> findByUser(User user);
    Optional<SocialAccount> findByUserAndProvider(User user, SocialAccountProvider provider);
    void deleteByUserAndProvider(User user, SocialAccountProvider provider);
}
