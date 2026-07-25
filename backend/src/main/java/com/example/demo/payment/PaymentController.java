package com.example.demo.payment;

import com.example.demo.payment.dto.CashPaymentDto;
import com.example.demo.payment.dto.PaymentConfirmDto;
import com.example.demo.payment.dto.PaymentDto;
import com.example.demo.payment.dto.PaymentPrepareDto;
import com.example.demo.security.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @GetMapping("/api/payment")
    public ResponseEntity<Page<PaymentDto>> getPaymentList(@RequestParam(name = "keyword", required = false) String keyword,
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
            Page<PaymentDto> payments=paymentService.getPaymentList(keyword, pageable, roles);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    @PostMapping("/api/payment/cash")
    public ResponseEntity<String> cashPayment(@RequestBody CashPaymentDto dto,
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
            paymentService.cashPayment(dto, roles);
            return ResponseEntity.ok("success");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/api/payment/prepare")
    public ResponseEntity<PaymentPrepareDto> preparePayment(@RequestBody PaymentPrepareDto dto,
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
            PaymentPrepareDto prepare=paymentService.preparePayment(dto.getBillingId(), dto.getAmount(), roles);
            return ResponseEntity.ok(prepare);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/api/payment/confirm")
    public ResponseEntity<String> confirmPayment(@RequestBody PaymentConfirmDto dto,
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
            paymentService.confirmPayment(dto, roles);
            return ResponseEntity.ok("success");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
