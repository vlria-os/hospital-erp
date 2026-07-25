package com.example.demo.schedule.aiSchedule.service;

import com.example.demo.schedule.aiSchedule.dto.AiManualConditionDto;
import com.example.demo.schedule.aiSchedule.dto.ConditionParseResultDto;
import com.example.demo.staff.Staff;
import com.example.demo.staff.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional
@RequiredArgsConstructor
public class ConditionParseService {
    private final StaffRepository staffRepository;

    public ConditionParseResultDto parse(Integer departmentId, Integer roleId, String text) {
        List<AiManualConditionDto> manualConditionList = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (text == null || text.isBlank()) {
            return ConditionParseResultDto.builder()
                    .manualConditionList(manualConditionList)
                    .warnings(warnings)
                    .build();
        }

        List<Staff> departmentStaff = departmentId != null
                ? staffRepository.findByDepartmentDepartmentId(departmentId)
                : staffRepository.findByRoleId(roleId);
        String[] lines = text.split("\\r?\\n");
        Pattern pattern = Pattern.compile(
                // [이름] + 공백 + [날짜] + 공백 + [근무유형]
                "^([가-힣A-Za-z0-9]+)\\s+(\\d{1,2}/\\d{1,2}|\\d{4}-\\d{2}-\\d{2})\\s+([A-Za-z가-힣_]+)$"
        );

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isBlank()) {
                continue;
            }

            Matcher matcher = pattern.matcher(trimmed);
            if (!matcher.find()) {
                warnings.add("해석 실패: " + trimmed);
                continue;
            }

            String staffName = matcher.group(1);
            String dateText = matcher.group(2);
            String typeText = matcher.group(3);

            Staff matchedStaff = departmentStaff.stream()
                    .filter(s -> staffName.equals(s.getName()))
                    .findFirst()
                    .orElse(null);

            if (matchedStaff == null) {
                warnings.add("직원을 찾을 수 없음: " + staffName);
                continue;
            }

            LocalDate workDate;
            try {
                workDate = parseDate(dateText);
            } catch (Exception e) {
                warnings.add("날짜 해석 실패: " + dateText);
                continue;
            }

            String normalizedType = normalizeType(typeText);
            String mode = isBlockType(normalizedType) ? "BLOCK" : "FIX";

            manualConditionList.add(AiManualConditionDto.builder()
                    .staffId(matchedStaff.getStaffId())
                    .staffName(matchedStaff.getName())
                    .workDate(workDate.toString())
                    .type(normalizedType)
                    .mode(mode)
                    .build());
        }

        return ConditionParseResultDto.builder()
                .manualConditionList(manualConditionList)
                .warnings(warnings)
                .build();
    }

    private LocalDate parseDate(String text){
        if(text.matches("\\d{4}-\\d{2}-\\d{2}")){
            return LocalDate.parse(text);
        }
        if (text.matches("\\d{1,2}/\\d{1,2}")){
            String[] parts = text.split("/");
            int month =Integer.parseInt(parts[0]);
            int day = Integer.parseInt(parts[1]);
            return LocalDate.of(Year.now().getValue(), month, day);
        }
        throw new IllegalStateException("지원하지 않는 날짜 형식");
    }

    private String normalizeType(String typeText){
        return switch (typeText.toUpperCase()){
            case "휴무", "OFF" -> "OFF";
            case "연차", "LEAVE" -> "LEAVE";
            case "교육", "EDUCATION" -> "EDUCATION";
            case "DAY","데이" -> "DAY";
            case "EVENING", "이브닝" -> "EVENING";
            case "NIGHT", "나이트" -> "NIGHT";
            case "DUTY", "당직" -> "DUTY";
            case "ON_CALL", "ONCALL","온콜" -> "ON_CALL";
            default -> typeText.toUpperCase();
        };
    }

    private boolean isBlockType(String type){
        return List.of("OFF","LEAVE","EDUCATION").contains(type);
    }
}
