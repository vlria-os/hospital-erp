package com.example.demo.staff;

import com.example.demo.staff.dto.*;
import com.example.demo.department.DepartmentDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {
    private final StaffService staffService;

    @PostMapping("/register")
    public ResponseEntity<?> registerStaff(@RequestBody StaffRegisterDto dto){
        Integer staffId = staffService.register(dto);
        return ResponseEntity.ok("직원등록완료 staffId="+staffId);
    }

    //엑셀 일괄등록
    @PostMapping("/bulk-upload")
    public ResponseEntity<StaffBulkUploadResponseDto> bulkUpload(@RequestBody List<StaffBulkUploadRequestDto> requestList){
        StaffBulkUploadResponseDto responseDto= staffService.bulkUpload(requestList);
        return ResponseEntity.ok(responseDto);
    }

    @GetMapping("/list")
    public ResponseEntity<Page<StaffResponseDto>> getAllStaff(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "staffId", direction = Sort.Direction.DESC) Pageable pageable){
        return ResponseEntity.ok(staffService.getAllStaff(keyword, pageable));
    }

    @GetMapping("/{staffId}")
    public ResponseEntity<StaffResponseDto> getStaffById(@PathVariable Integer staffId){
        StaffResponseDto dto=staffService.getStaffById(staffId);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateStaff(@RequestBody StaffUpdateDto dto){
        staffService.updateStaff(dto);
        return ResponseEntity.ok(
                Map.of(
                        "result","success"
                )
        );
    }
    @PutMapping("/active/{staffId}")
    public ResponseEntity<?> updateActive(@PathVariable Integer staffId,
                                          @RequestBody Map<String, String> body) {
        staffService.updateIsActive(staffId, body.get("isActive"));
        return ResponseEntity.ok(Map.of("result", "success"));

    }
    @GetMapping("/doctor")
    public Map<String,Object> getDepartment(@RequestParam Integer departmentId){
        DepartmentDto departmentDto = new DepartmentDto();
        departmentDto.setDepartmentId(departmentId);
        return staffService.getDoctor(departmentDto);
    }
}
