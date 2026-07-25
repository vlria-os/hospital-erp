package com.example.demo.billing;

import com.example.demo.billing.dto.BillingDto;
import com.example.demo.security.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class BillingController {
    private final BillingService billingService;

    @GetMapping("/api/billing")
    public ResponseEntity<Page<BillingDto>> getBillingList(@RequestParam(name = "keyword", required = false) String keyword,
                                                              @AuthenticationPrincipal CustomUserDetails details,
                                                              Pageable pageable){
        if (details == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<String> roles=details.getAuthorities().stream().map(r -> r.toString())
                .map(role -> role.startsWith("ROLE_") ? role.substring(5):role).toList();

        if (roles == null || roles.isEmpty()){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try{
            Page<BillingDto> billings=billingService.getBillingList(keyword, pageable, roles);
            return ResponseEntity.ok(billings);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/api/billing/total/amount")
    public ResponseEntity<String> insertTotalAmount(@RequestBody BillingDto dto,
                                                    @AuthenticationPrincipal CustomUserDetails details){
        if (details == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<String> roles=details.getAuthorities().stream().map(r -> r.toString())
                .map(role -> role.startsWith("ROLE_") ? role.substring(5):role).toList();

        if (roles == null || roles.isEmpty()){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try{
            billingService.insertTotalAmount(dto, roles);
            return ResponseEntity.ok("success");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
