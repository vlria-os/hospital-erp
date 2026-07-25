package com.example.demo.reservation;

import com.example.demo.reservation.dto.ReservationDto;
import com.example.demo.reservation.dto.ReservationResponse;
import com.example.demo.reservation.service.ReservationService;
import com.example.demo.security.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ReservationController {
    private final ReservationService reservationService;

    @PostMapping("/api/reservation")
    public Map<String,Object> reservationInsert(@RequestBody ReservationDto reservationDto,
                                                @AuthenticationPrincipal CustomUserDetails details){
        Integer userId=details.getUserId();

        Map<String,Object> map=new HashMap<>();
        Integer reservationId=reservationService.reservationReceived(reservationDto, userId);
        map.put("reservationId",reservationId);
        return map;
    }

    @PostMapping("/api/reservation/confirm")
    public Map<String,Object> reservationConfirmed(@RequestBody ReservationDto reservationDto){
        Map<String,Object> map=new HashMap<>();

        Integer reservationId=null;
        if(reservationDto.getDoctorId() != null){
            reservationId=reservationService.reservationConfirmed(reservationDto);
        }else{
            reservationId=reservationService.reservationPending(reservationDto);
        }

        map.put("reservationId",reservationId);
        return map;
    }

    @GetMapping("/api/reservation")
    public Page<ReservationResponse> reservationList(@RequestParam(required = false) Integer department,
                                               @RequestParam(required = false) String name,
                                               Pageable pageable){
        if(department==null){
            return reservationService.reservationList(name,pageable);
        }else{
            return reservationService.reservationList(department,name,pageable);
        }
    }

    @GetMapping("/api/reservation/pending")
    public Page<ReservationResponse> reservationPendingList(@RequestParam(required = false) Integer department,
                                                     @RequestParam(required = false) String name,
                                                     Pageable pageable){
        if(department==null) {
            return reservationService.reservationPendingList(name,pageable);
        }else{
            return reservationService.reservationPendingList(department,name,pageable);
        }
    }

    @GetMapping("/api/reservation/confirmed")
    public Page<ReservationResponse> reservationConfirmedList(@RequestParam(required = false) Integer department,
                                                       @RequestParam(required = false) String name,
                                                       Pageable pageable){
        Map<String,Object> map=new HashMap<>();
        List<ReservationResponse> reservation;

        if(department==null) {
            return reservationService.reservationConfirmedList(name,pageable);
        }else{
            return reservationService.reservationConfirmedList(department,name,pageable);
        }
    }

    @GetMapping("/api/reservation/delete")
    public Map<String, Object> reservationCancel(@RequestParam("reservationId") Integer reservationId){
        return Map.of("reservationId",reservationService.reservationCancel(reservationId));
    }

    @PutMapping("/api/reservation")
    public Map<String, Object> reservationUpdate(@RequestBody ReservationDto reservationDto){
        return Map.of("reservationId", reservationService.reservationUpdate(reservationDto));
    }
}
