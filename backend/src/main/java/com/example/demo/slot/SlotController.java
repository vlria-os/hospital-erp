package com.example.demo.slot;

import com.example.demo.slot.dto.SlotDayResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SlotController {
    private final SlotService slotService;

    @GetMapping("/api/slot/doctor")
    public Map<String,Object> MonthlyList(@RequestParam("monthly") LocalDateTime monthly,
                                          @RequestParam("doctorId") Integer doctorId){
        return Map.of("content",slotService.MonthlyList(monthly,doctorId));
    }
    @GetMapping("/api/slot/department")
    public Map<String,Object> MonthlyListByDepartment(@RequestParam("monthly") LocalDateTime monthly,
                                          @RequestParam("departmentId") Integer departmentId){
        LocalDate now = LocalDate.now();
        LocalDate requestMonth = monthly.toLocalDate();

        List<SlotDayResponse> result;

        if (requestMonth.getYear() == now.getYear() &&
                requestMonth.getMonth() == now.getMonth()) {
            result = slotService.MonthlyListByDepartment(monthly, departmentId);
        }
        else {
            result = slotService.MonthlyListByDepartmentInNext(monthly, departmentId);
        }

        return Map.of("content", result);
    }

    @GetMapping("/api/slot/daily/doctor")
    public Map<String,Object> DailyList(@RequestParam("daily") LocalDateTime daily,
                                                    @RequestParam("doctorId") Integer doctorId){
        return Map.of("content",slotService.DailyList(daily,doctorId));
    }

    @GetMapping("/api/slot/daily/department")
    public Map<String,Object> DailyListByDepartment(@RequestParam("daily") LocalDateTime daily,
                                                    @RequestParam("departmentId") Integer departmentId){
        return Map.of("content",slotService.DailyListByDepartment(daily,departmentId));
    }
}
