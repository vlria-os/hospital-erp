package com.example.demo.patient;

import com.example.demo.patient.dto.*;
import com.example.demo.security.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
public class PatientController {
    private final PatientService patientService;

    @GetMapping("/reservation")
    public ResponseEntity<Page<MyReservationResponse>> getMyReservations(@RequestParam(name = "status", required = false) String status,
                                                                         @AuthenticationPrincipal CustomUserDetails details, Pageable pageable){
        if (details == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Integer userId=details.getUserId();
        if (userId == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try{
            Page<MyReservationResponse> responses=patientService.getMyReservations(userId, status, pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/reservation/cancel")
    public ResponseEntity<ReservationCancelDto> cancelReservation(@RequestBody ReservationCancelDto dto,
                                                    @AuthenticationPrincipal CustomUserDetails details){
        if (details == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Integer userId=details.getUserId();
        if (userId == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try{
            ReservationCancelDto response=patientService.cancelReservation(userId, dto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/reception")
    public ResponseEntity<Page<MyReceptionResponse>> getMyReceptions(@AuthenticationPrincipal CustomUserDetails details, Pageable pageable,
                                                                     @RequestParam(name = "sort") String sort){
        if (details == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Integer userId=details.getUserId();
        if (userId == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try{
            Page<MyReceptionResponse> responses=patientService.getMyReceptions(userId, pageable, sort);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/payment")
    public ResponseEntity<Page<MyPaymentResponse>> getMyPaymentList(@RequestParam(name = "receptionId") Integer receptionId,
                                                                    @AuthenticationPrincipal CustomUserDetails details, Pageable pageable){
        if (details == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Integer userId=details.getUserId();
        if (userId == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try{
            Page<MyPaymentResponse> responses=patientService.getMyPaymentList(userId, receptionId, pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/information")
    public ResponseEntity<MyInfoResponse> getMyInformation(@AuthenticationPrincipal CustomUserDetails details){
        if (details == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Integer userId=details.getUserId();
        if (userId == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try{
            MyInfoResponse response=patientService.getMyInformation(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/check/password")
    public ResponseEntity<String> checkPassword(@RequestParam("password") String password,
                                                 @AuthenticationPrincipal CustomUserDetails details){
        if (details == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Integer userId=details.getUserId();
        if (userId == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try{
            String result=patientService.checkMyPassword(userId, password);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/information/update")
    public ResponseEntity<InformationUpdateDto> updateMyInformation(@RequestBody InformationUpdateDto dto,
                                                                    @AuthenticationPrincipal CustomUserDetails details){
        if (details == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Integer userId=details.getUserId();
        if (userId == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try{
            InformationUpdateDto response=patientService.updateMyInformation(userId, dto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/remove/social")
    public ResponseEntity<String> removeMySocialAccount(@RequestParam("provider") String provider,
                                                        @AuthenticationPrincipal CustomUserDetails details){
        if (details == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Integer userId=details.getUserId();
        if (userId == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try{
            patientService.removeMySocialAccount(userId, provider);
            return ResponseEntity.ok("success");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
