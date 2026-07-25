package com.example.demo.schedule.aiSchedule.service;

import com.example.demo.department.Department;
import com.example.demo.department.DepartmentRepository;
import com.example.demo.role.Role;
import com.example.demo.role.RoleRepository;
import com.example.demo.schedule.aiSchedule.dto.DepartmentSchedulePolicyDto;
import com.example.demo.schedule.aiSchedule.entity.DepartmentSchedulePolicy;
import com.example.demo.schedule.aiSchedule.entity.DepartmentSchedulePolicyShift;
import com.example.demo.schedule.aiSchedule.repository.DepartmentSchedulePolicyRepository;
import com.example.demo.schedule.aiSchedule.repository.DepartmentSchedulePolicyShiftRepository;
import com.example.demo.schedule.staff.entity.StaffScheduleType;
import com.example.demo.schedule.staff.repository.StaffScheduleTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SchedulePolicyService {
    private final DepartmentSchedulePolicyRepository departmentSchedulePolicyRepository;
    private final DepartmentSchedulePolicyShiftRepository departmentSchedulePolicyShiftRepository;
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;
    private final StaffScheduleTypeRepository staffScheduleTypeRepository;

    // 전체 정책 조회
    public List<DepartmentSchedulePolicyDto> getAllPolicies() {
        return departmentSchedulePolicyRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    // 단건 조회
    public DepartmentSchedulePolicyDto getPolicyById(Integer policyId) {
        DepartmentSchedulePolicy policy = departmentSchedulePolicyRepository
                .findById(policyId)
                .orElseThrow(() -> new RuntimeException("해당 스케줄 정책이 없습니다"));
        return toDto(policy);
    }

    // 정책 등록
    public DepartmentSchedulePolicyDto createPolicy(DepartmentSchedulePolicyDto dto) {
        Role role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new RuntimeException("해당 role이 없습니다"));

        Department department = null;
        if (dto.getDepartmentId() != null) {
            department = departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("해당 부서가 없습니다"));
        }

        DepartmentSchedulePolicy policy = DepartmentSchedulePolicy.builder()
                .department(department)
                .role(role)
                .maxConsecutiveNight(dto.getMaxConsecutiveNight())
                .blockNightToDay(dto.getBlockNightToDay())
                .blockNightToEvening(dto.getBlockNightToEvening())
                .maxWorkDaysPerWeek(dto.getMaxWorkDaysPerWeek())
                .isActive(true)
                .build();

        departmentSchedulePolicyRepository.save(policy);
        saveShifts(policy, dto.getShiftTypes(), dto.getMinStaffMap());

        return toDto(policy);
    }

    // 정책 수정
    public DepartmentSchedulePolicyDto updatePolicy(Integer policyId, DepartmentSchedulePolicyDto dto) {
        DepartmentSchedulePolicy policy = departmentSchedulePolicyRepository
                .findById(policyId)
                .orElseThrow(() -> new RuntimeException("해당 스케줄 정책이 없습니다"));

        if (dto.getRoleId() != null) {
            Role role = roleRepository.findById(dto.getRoleId())
                    .orElseThrow(() -> new RuntimeException("해당 role이 없습니다"));
            policy.setRole(role);
        }

        if (dto.getDepartmentId() != null) {
            Department department = departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("해당 부서가 없습니다"));
            policy.setDepartment(department);
        }

        policy.setMaxConsecutiveNight(dto.getMaxConsecutiveNight());
        policy.setBlockNightToDay(dto.getBlockNightToDay());
        policy.setBlockNightToEvening(dto.getBlockNightToEvening());
        policy.setMaxWorkDaysPerWeek(dto.getMaxWorkDaysPerWeek());

        departmentSchedulePolicyShiftRepository.deleteByPolicyPolicyId(policy.getPolicyId());
        saveShifts(policy, dto.getShiftTypes(), dto.getMinStaffMap());

        return toDto(policy);
    }

    // 정책 비활성화
    public void deactivatePolicy(Integer policyId) {
        DepartmentSchedulePolicy policy = departmentSchedulePolicyRepository
                .findById(policyId)
                .orElseThrow(() -> new RuntimeException("해당 스케줄 정책이 없습니다"));
        policy.setIsActive(false);
    }

    // shift 저장 공통 로직
    private void saveShifts(DepartmentSchedulePolicy policy, List<String> shiftTypes, Map<String, Integer> minStaffMap) {
        if (shiftTypes == null) return;

        for (String typeCode : shiftTypes) {
            StaffScheduleType scheduleType = staffScheduleTypeRepository.findByTypeCode(typeCode)
                    .orElseThrow(() -> new RuntimeException("근무 유형을 찾을 수 없습니다: " + typeCode));

            Integer minStaff = (minStaffMap != null) ? minStaffMap.getOrDefault(typeCode, 0) : 0;

            DepartmentSchedulePolicyShift shift = DepartmentSchedulePolicyShift.builder()
                    .policy(policy)
                    .scheduleType(scheduleType)
                    .minStaff(minStaff)
                    .isEnabled(true)
                    .build();

            departmentSchedulePolicyShiftRepository.save(shift);
        }
    }

    // Entity -> DTO 변환
    private DepartmentSchedulePolicyDto toDto(DepartmentSchedulePolicy policy) {
        List<DepartmentSchedulePolicyShift> shiftList = departmentSchedulePolicyShiftRepository
                .findByPolicyPolicyId(policy.getPolicyId());

        List<String> shiftTypes = shiftList.stream()
                .filter(shift -> Boolean.TRUE.equals(shift.getIsEnabled()))
                .map(shift -> shift.getScheduleType().getTypeCode())
                .toList();

        Map<String, Integer> minStaffMap = shiftList.stream()
                .filter(shift -> Boolean.TRUE.equals(shift.getIsEnabled()))
                .collect(Collectors.toMap(
                        shift -> shift.getScheduleType().getTypeCode(),
                        DepartmentSchedulePolicyShift::getMinStaff
                ));

        return DepartmentSchedulePolicyDto.builder()
                .policyId(policy.getPolicyId())
                .departmentId(policy.getDepartment() != null ? policy.getDepartment().getDepartmentId() : null)
                .departmentName(policy.getDepartment() != null ? policy.getDepartment().getDepartmentName() : null)
                .roleId(policy.getRole().getRoleId())
                .jobType(policy.getRole().getRoleName())
                .shiftTypes(shiftTypes)
                .minStaffMap(minStaffMap)
                .maxConsecutiveNight(policy.getMaxConsecutiveNight())
                .blockNightToDay(policy.getBlockNightToDay())
                .blockNightToEvening(policy.getBlockNightToEvening())
                .maxWorkDaysPerWeek(policy.getMaxWorkDaysPerWeek())
                .isActive(policy.getIsActive())
                .build();
    }
}
