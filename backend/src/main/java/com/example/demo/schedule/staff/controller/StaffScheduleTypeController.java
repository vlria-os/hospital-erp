package com.example.demo.schedule.staff.controller;

import com.example.demo.schedule.staff.dto.StaffScheduleTypeDto;
import com.example.demo.schedule.staff.service.StaffScheduleTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/schedule_type")
public class StaffScheduleTypeController {
    private final StaffScheduleTypeService staffScheduleTypeService;

    //등록
    @PostMapping("/register")
    public Integer register(@RequestBody StaffScheduleTypeDto dto){
        return staffScheduleTypeService.register(dto);
    }

    @GetMapping("/list")
    public List<StaffScheduleTypeDto> selectAll(){
        return staffScheduleTypeService.selectAll();
    }

    @GetMapping("/{scheduleTypeId}")
    public StaffScheduleTypeDto selectOne(@PathVariable Integer scheduleTypeId){
        return staffScheduleTypeService.selectOne(scheduleTypeId);
    }

    @PutMapping("/{scheduleTypeId}")
    public StaffScheduleTypeDto update(@PathVariable Integer scheduleTypeId,
                                       @RequestBody StaffScheduleTypeDto dto){
        return staffScheduleTypeService.update(scheduleTypeId, dto);
    }

    @DeleteMapping("/{scheduleTypeId}")
    public String delete(@PathVariable Integer scheduleTypeId){
        staffScheduleTypeService.delete(scheduleTypeId);
        return "삭제완료";
    }
}
