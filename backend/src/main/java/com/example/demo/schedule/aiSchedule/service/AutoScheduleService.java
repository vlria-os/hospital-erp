package com.example.demo.schedule.aiSchedule.service;

import com.example.demo.schedule.aiSchedule.dto.*;
import com.example.demo.schedule.staff.entity.StaffSchedule;
import com.example.demo.schedule.staff.entity.StaffScheduleType;
import com.example.demo.schedule.staff.repository.StaffScheduleRepository;
import com.example.demo.schedule.staff.repository.StaffScheduleTypeRepository;
import com.example.demo.staff.Staff;
import com.example.demo.staff.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AutoScheduleService {

    private final SchedulePolicyService schedulePolicyService;
    private final ConditionParseService conditionParseService;
    private final StaffRepository staffRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final StaffScheduleTypeRepository staffScheduleTypeRepository;
    private final RestTemplate restTemplate;

    @Value("${ai.schedule.url}")
    private String aiScheduleUrl;

    @Transactional
    public AiScheduleResultDto generateSchedule(AutoScheduleRequestDto request) {

        // 부서 정책 (근무유형, 최소인원, 제한 규칙)
        DepartmentSchedulePolicyDto policy =
                schedulePolicyService.getPolicyById(request.getPolicyId());

        // 해당 직군 직원 목록 로드 — 의사는 부서로, 간호사/원무과는 roleId로 조회
        List<Staff> staffList = policy.getDepartmentId() != null
                ? staffRepository.findByDepartmentDepartmentId(policy.getDepartmentId())
                : staffRepository.findByRoleId(policy.getRoleId());

        // 자연어 추가조건  (ex: "홍길동 5/5 OFF")
        ConditionParseResultDto parsed =
                conditionParseService.parse(policy.getDepartmentId(), policy.getRoleId(), request.getExtraCondition());

        // AI에 넘길 입력 DTO
        AiScheduleInputDto input = buildInput(request, policy, staffList, parsed);

        // Python AI 서버 호출
        AiScheduleResultDto result = callAiServer(input);

        // BLOCK 조건(OFF/LEAVE/EDUCATION)은 AI가 배정에서 제외만 하고 결과에 포함하지 않으므로 직접 추가
        if (parsed.getManualConditionList() != null) {
            for (AiManualConditionDto condition : parsed.getManualConditionList()) {
                if ("BLOCK".equals(condition.getMode())) {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("staffId", condition.getStaffId());
                    entry.put("staffName", condition.getStaffName());
                    entry.put("workDate", condition.getWorkDate());
                    entry.put("shiftType", condition.getType());
                    result.getAssignments().add(entry);
                }
            }
        }

        // 파싱 경고가 있으면 결과 경고에 합치기
        if (parsed.getWarnings() != null) {
            result.getWarnings().addAll(parsed.getWarnings());
        }

        // 저장은 하지 않고 미리보기 결과만 반환
        return result;
    }

    // 프론트에서 미리보기 확인 후 저장 요청 시 호출
    @Transactional
    public AiScheduleResultDto confirmSchedule(ConfirmScheduleRequestDto request) {
        List<String> validationErrors = saveSchedules(request.getAssignments());

        return AiScheduleResultDto.builder()
                .assignments(request.getAssignments())
                .unassigned(new ArrayList<>())
                .warnings(new ArrayList<>())
                .validationErrors(validationErrors)
                .build();
    }


    private AiScheduleInputDto buildInput(AutoScheduleRequestDto request,
                                          DepartmentSchedulePolicyDto policy,
                                          List<Staff> staffList,
                                          ConditionParseResultDto parsed) {

        // Staff 엔티티 → Python이 읽을 수 있는 Map 형태로 변환
        List<Map<String, Object>> staffMapList = staffList.stream()
                .map(s -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("staffId", s.getStaffId());
                    map.put("staffName", s.getName());
                    return map;
                })
                .toList();

        // 요청에 값이 있으면 요청값 사용, 없으면 DB 정책값 사용
        Map<String, Integer> minStaffMap = request.getMinStaffMap() != null
                ? request.getMinStaffMap() : policy.getMinStaffMap();
        Integer maxConsecutiveNight = request.getMaxConsecutiveNight() != null
                ? request.getMaxConsecutiveNight() : policy.getMaxConsecutiveNight();
        Boolean blockNightToDay = request.getBlockNightToDay() != null
                ? request.getBlockNightToDay() : policy.getBlockNightToDay();
        Boolean blockNightToEvening = request.getBlockNightToEvening() != null
                ? request.getBlockNightToEvening() : policy.getBlockNightToEvening();
        Integer maxWorkDaysPerWeek = request.getMaxWorkDaysPerWeek() != null
                ? request.getMaxWorkDaysPerWeek() : policy.getMaxWorkDaysPerWeek();

        // 규칙 문자열 생성
        List<String> rules = buildRules(maxConsecutiveNight, blockNightToDay,
                blockNightToEvening, maxWorkDaysPerWeek);

        return AiScheduleInputDto.builder()
                .departmentId(policy.getDepartmentId())
                .departmentName(policy.getDepartmentName())
                .jobType(policy.getJobType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .shiftTypes(policy.getShiftTypes())
                .minStaffMap(minStaffMap)
                .staffList(staffMapList)
                .manualConditionList(parsed.getManualConditionList())
                .rules(rules)
                .build();
    }

    // Boolean/Integer 값을 AI가 이해할 수 있는 규칙 문장으로 변환
    private List<String> buildRules(Integer maxConsecutiveNight, Boolean blockNightToDay,
                                    Boolean blockNightToEvening, Integer maxWorkDaysPerWeek) {
        List<String> rules = new ArrayList<>();

        if (maxConsecutiveNight != null) {
            rules.add("연속 야간(NIGHT) 근무 최대 " + maxConsecutiveNight + "일");
        }
        if (Boolean.TRUE.equals(blockNightToDay)) {
            rules.add("야간(NIGHT) 다음날 데이(DAY) 배정 금지");
        }
        if (Boolean.TRUE.equals(blockNightToEvening)) {
            rules.add("야간(NIGHT) 다음날 이브닝(EVENING) 배정 금지");
        }
        if (maxWorkDaysPerWeek != null) {
            rules.add("주당 최대 근무일 " + maxWorkDaysPerWeek + "일");
        }

        return rules;
    }

    // Python FastAPI 서버로 POST 요청을 보내고 결과를 받아옴
    private AiScheduleResultDto callAiServer(AiScheduleInputDto input) {
        try {
            PythonScheduleResponseDto pythonResponse =
                    restTemplate.postForObject(aiScheduleUrl, input, PythonScheduleResponseDto.class);

            return AiScheduleResultDto.builder()
                    .assignments(pythonResponse.getScheduleList())
                    .unassigned(new ArrayList<>())
                    .warnings(new ArrayList<>())
                    .validationErrors(new ArrayList<>())
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("AI 스케줄 서버 호출 실패: " + e.getMessage());
        }
    }

    // AI 결과 assignments를 StaffSchedule 엔티티로 변환 후 저장
    private List<String> saveSchedules(List<Map<String, Object>> assignments) {
        List<String> errors = new ArrayList<>();

        for (Map<String, Object> assignment : assignments) {
            Integer staffId = (Integer) assignment.get("staffId");
            String workDateStr = (String) assignment.get("workDate");
            String shiftType = (String) assignment.get("shiftType");

            LocalDate workDate = LocalDate.parse(workDateStr);

            // 이미 해당 날짜에 스케줄이 존재하면 저장 스킵
            if (staffScheduleRepository.existsByStaff_StaffIdAndWorkDate(staffId, workDate)) {
                errors.add("중복 스킵: staffId=" + staffId + ", date=" + workDateStr);
                continue;
            }

            Staff staff = staffRepository.findByStaffId(staffId);
            if (staff == null) {
                errors.add("직원 없음: staffId=" + staffId);
                continue;
            }

            StaffScheduleType scheduleType = staffScheduleTypeRepository
                    .findByTypeCode(shiftType)
                    .orElse(null);
            if (scheduleType == null) {
                errors.add("근무유형 없음: " + shiftType);
                continue;
            }

            staffScheduleRepository.save(StaffSchedule.builder()
                    .staff(staff)
                    .workDate(workDate)
                    .staffScheduleType(scheduleType)
                    .status("AI_GENERATED")
                    .build());
        }

        return errors;
    }
}