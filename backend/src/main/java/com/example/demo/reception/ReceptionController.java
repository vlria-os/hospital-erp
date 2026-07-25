package com.example.demo.reception;

import com.example.demo.reception.dto.ReceptionResponse;
import com.example.demo.reservation.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ReceptionController {
    private final ReservationService reservationService;
    private final ReceptionService receptionService;

    @GetMapping("/api/administration")
    public Page<ReceptionResponse> receptionList(Pageable pageable){
        return receptionService.receptionList("", pageable);
    }

    @GetMapping("/api/administration/recieved")
    public Map<String,Object> receptionConfirmed(@RequestParam Integer receptionId){
        return receptionService.receptionReceived(receptionId);
    }

    @PatchMapping("/api/reception/status")
    public Integer receptionStatus(@RequestParam Integer receptionId,
                                   @RequestParam ReceptionStatus status){
        if(status.equals(ReceptionStatus.RECEIVED)){
            return receptionService.receptionConsulting(receptionId);
        }else{
            return receptionService.receptionCompleted(receptionId);
        }

    }

    @GetMapping("/api/reception")
    public Page<ReceptionResponse> receptionStatusList(@RequestParam(required = false) String status,
                                                  @RequestParam(required = false) String name,
                                                  Pageable pageable){
        if (status == null || status.isEmpty()) {
            return receptionService.receptionList(name, pageable);
        }else{
            return receptionService.receptionStatusList(ReceptionStatus.valueOf(status), name, pageable);
        }
    }

    @GetMapping("/api/reception/cancel")
    public Integer receptionCancel(@RequestParam Integer reservationId){
        return receptionService.receptionCancel(reservationId);
    }
}
