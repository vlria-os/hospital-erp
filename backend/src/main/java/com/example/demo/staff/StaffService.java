package com.example.demo.staff;

import com.example.demo.department.Department;
import com.example.demo.department.DepartmentDto;
import com.example.demo.department.DepartmentRepository;
import com.example.demo.role.RoleRepository;
import com.example.demo.staff.dto.*;
import com.example.demo.user.User;
import com.example.demo.user.UserRepository;
import com.example.demo.userRole.UserRole;
import com.example.demo.userRole.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class StaffService {
    private final StaffRepository staffRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRoleRepository userRoleRepository;

    @Autowired
    @Lazy
    private StaffService self;

    //직원등록 (User 동시 생성)
    public Integer register(StaffRegisterDto dto){
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("이미 사용 중인 이메일입니다.");
        }

        User user = userRepository.save(User.builder()
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .status("Y")
                .build());

        Department department=null;
        if(dto.getDepartmentId() !=null){
            department=departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(()->new RuntimeException("해당 부서가 없습니다"));
        }

        Staff manager = null;
        if(dto.getManagerId() !=null){
            manager = staffRepository.findById(dto.getManagerId())
                    .orElseThrow(()-> new RuntimeException("해당 담당자가 없습니다"));
        }

        Staff staff= Staff.builder()
                .user(user)
                .department(department)
                .manager(manager)
                .name(dto.getName())
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .isActive(dto.getIsActive() !=null ? dto.getIsActive() : "Y")
                .build();

        Staff savedStaff = staffRepository.save(staff);

        if (dto.getRoleIds() == null || dto.getRoleIds().isEmpty()) {
            throw new RuntimeException("직무(roleIds)는 최소 1개 이상 필요합니다.");
        }
        for (Integer roleId : dto.getRoleIds()) {
            userRoleRepository.save(UserRole.builder()
                    .user(user)
                    .role(roleRepository.findById(roleId)
                            .orElseThrow(() -> new RuntimeException("해당 직무가 없습니다: " + roleId)))
                    .build());
        }

        return savedStaff.getStaffId();
    }

    //직원엑셀 일괄등록
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public StaffBulkUploadResponseDto bulkUpload(List<StaffBulkUploadRequestDto> requestList){
        int successCount = 0;
        List<StaffBulkUploadResponseDto.FailDetail> failList = new ArrayList<>();

        for (int i = 0; i < requestList.size(); i++) {
            StaffBulkUploadRequestDto dto = requestList.get(i);
            int rowNum = i + 1;
            try {
                self.processOneBulkRow(dto);
                successCount++;
            } catch (Exception e) {
                failList.add(StaffBulkUploadResponseDto.FailDetail.builder()
                        .row(rowNum)
                        .userId(dto.getEmail() != null ? dto.getEmail() : "-")
                        .name(dto.getName())
                        .reason(e.getMessage())
                        .build());
            }
        }

        return StaffBulkUploadResponseDto.builder()
                .successCount(successCount)
                .failCount(failList.size())
                .failDetails(failList)
                .build();
    }

    // 행 하나를 독립 트랜잭션으로 처리 — 실패해도 다른 행에 영향 없음
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processOneBulkRow(StaffBulkUploadRequestDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("이미 사용 중인 이메일입니다: " + dto.getEmail());
        }

        Department department = departmentRepository.findByDepartmentName(dto.getDeptName())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 부서명입니다"));

        Staff manager = null;
        if (dto.getManagerId() != null) {
            manager = staffRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("존재하지 않는 담당자입니다"));
        }

        User user = userRepository.save(User.builder()
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .status("Y")
                .build());

        staffRepository.save(Staff.builder()
                .user(user)
                .department(department)
                .manager(manager)
                .name(dto.getName())
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .isActive(dto.getIsActive())
                .build());

        if (dto.getRoleIds() == null || dto.getRoleIds().isEmpty()) {
            throw new RuntimeException("직급(roleIds)는 최소 1개 이상 필요합니다.");
        }
        for (Integer roleId : dto.getRoleIds()) {
            userRoleRepository.save(UserRole.builder()
                    .user(user)
                    .role(roleRepository.findById(roleId)
                            .orElseThrow(() -> new RuntimeException("해당 직급이 없습니다: " + roleId)))
                    .build());
        }
    }

    //전체조회 (페이징 + 키워드 검색)
    public Page<StaffResponseDto> getAllStaff(String keyword, Pageable pageable){
        if (keyword == null || keyword.isBlank()) {
            return staffRepository.findAll(pageable).map(this::entityToDto);
        }
        return staffRepository.findAllWithKeyword(keyword, pageable).map(this::entityToDto);
    }

    //Entity->dto
    private StaffResponseDto entityToDto(Staff staff){
        String roleName = null;
        if (staff.getUser() != null) {
            roleName = userRoleRepository.findByUser(staff.getUser())
                    .stream()
                    .filter(ur->ur.getRole().getParentRole() != null)
                    .findFirst()
                    .or(()-> userRoleRepository.findByUser(staff.getUser())
                            .stream().findFirst())
                    .map(ur -> ur.getRole().getRoleName())
                    .orElse(null);
        }

        String departmentName = staff.getDepartment() != null
                ? staff.getDepartment().getDepartmentName()
                : resolveDepartmentName(roleName);

        return StaffResponseDto.builder()
                .staffId(staff.getStaffId())
                .name(staff.getName())
                .phone(staff.getPhone())
                .address(staff.getAddress())
                .isActive(staff.getIsActive())
                .userId(staff.getUser() != null? staff.getUser().getUserId() : null)
                .email(staff.getUser() !=null? staff.getUser().getEmail():null)
                .departmentId(staff.getDepartment() !=null? staff.getDepartment().getDepartmentId():null)
                .departmentName(departmentName)
                .roleName(roleName)
                .managerId(staff.getManager() != null? staff.getManager().getStaffId() : null)
                .managerName(staff.getManager() != null? staff.getManager().getName(): null)
                .build();
    }

    private String resolveDepartmentName(String roleName) {
        if (roleName == null) return null;
        return switch (roleName) {
            case "NURSE", "HEAD_NURSE" -> "간호부";
            case "ADMIN", "ADMINISTRATION" -> "원무과";
            default -> null;
        };
    }

    public Map<String, Object> getDoctor(DepartmentDto departmentDto) {
        Department department = departmentRepository.findByDepartmentId(departmentDto.getDepartmentId());
        List<StaffDto> list = staffRepository.findDoctorsByDepartment(department)
                .orElseThrow(() -> new RuntimeException("Not exist"))
                .stream()
                .map(doc -> StaffDto.builder()
                        .staffId(doc.getStaffId())
                        .name(doc.getName())
                        .build())
                .toList();
        return Map.of("content", list);
    }

    //상세조회
    public StaffResponseDto getStaffById(Integer staffId){
        Staff staff=staffRepository.findById(staffId)
                .orElseThrow(()->new RuntimeException("해당 직원이 없습니다"));
        return entityToDto(staff);
    }

    //수정
    public void updateStaff(StaffUpdateDto dto) {

        if (dto.getStaffId() == null) {
            throw new RuntimeException("staffId는 필수입니다.");
        }
        if (dto.getUserId() == null) {
            throw new RuntimeException("userId는 필수입니다.");
        }
        if (dto.getDepartmentId() == null) {
            throw new RuntimeException("departmentId는 필수입니다.");
        }

        Staff staff = staffRepository.findById(dto.getStaffId())
                .orElseThrow(() -> new RuntimeException("해당 직원이 없습니다."));

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("해당 유저가 없습니다."));

        Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("해당 부서가 없습니다."));

        Staff manager = null;
        if (dto.getManagerId() != null) {
            manager = staffRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new RuntimeException("해당 매니저가 없습니다."));
        }

        staff.setUser(user);
        staff.setDepartment(department);
        staff.setManager(manager);
        staff.setName(dto.getName());
        staff.setPhone(dto.getPhone());
        staff.setAddress(dto.getAddress());
        staff.setIsActive(dto.getIsActive());

        if (dto.getRoleIds() != null && !dto.getRoleIds().isEmpty()) {
            userRoleRepository.deleteByUser(user);
            for (Integer roleId : dto.getRoleIds()) {
                userRoleRepository.save(UserRole.builder()
                        .user(user)
                        .role(roleRepository.findById(roleId)
                                .orElseThrow(() -> new RuntimeException("해당 직급이 없습니다: " + roleId)))
                        .build());
            }
        }
    }

    //soft delete
    public void updateIsActive(Integer staffId, String isActive){
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("해당 직원이 없습니다"));

        staff.setIsActive(isActive);
    }
}
